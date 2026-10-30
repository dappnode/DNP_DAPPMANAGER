import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import type { VerifiedRpc } from "@dappnode/toolkit";

export interface UpdateLightClientOptions {
  binary: string;
  dataDir: string;
  checkpoint?: string;
  executionRpc: string;
  consensusRpc: string;
  log: (level: "info" | "warn", message: string) => void;
  startupTimeoutMs?: number;
}

/** Own the helper and its loopback transport; an arbitrary RPC URL is never a verifier. */
export class UpdateLightClient implements VerifiedRpc {
  private child?: ChildProcess;
  private endpoint?: string;
  private starting?: Promise<void>;
  private stopped = false;
  private lastFailure = 0;
  private requestId = 0;

  constructor(private readonly options: UpdateLightClientOptions) {}

  async request(method: string, params: unknown[]): Promise<unknown> {
    if (this.stopped) throw new Error("CHAIN VERIFICATION: light client is stopped");
    if (!this.child || this.starting) {
      if (!this.starting) {
        if (Date.now() - this.lastFailure < 5000)
          throw new Error("CHAIN VERIFICATION: light client is unavailable; check RPCs and checkpoint");
        this.starting = this.launch()
          .catch(async (error) => {
            this.lastFailure = Date.now();
            await this.terminate();
            throw error;
          })
          .finally(() => {
            this.starting = undefined;
          });
      }
      await this.starting;
    }
    return this.send(method, params);
  }

  async stop(): Promise<void> {
    this.stopped = true;
    await this.terminate();
    await this.starting?.catch(() => undefined);
  }

  private async launch(): Promise<void> {
    const { checkpoint, dataDir, executionRpc, consensusRpc, binary } = this.options;
    for (const url of [executionRpc, consensusRpc]) {
      if (!["http:", "https:"].includes(new URL(url).protocol))
        throw new Error("CHAIN VERIFICATION: RPC URLs must use HTTP(S)");
    }
    if (checkpoint && !/^0x[0-9a-f]{64}$/i.test(checkpoint))
      throw new Error("CHAIN VERIFICATION: UPDATE_CHAIN_CHECKPOINT must be a 32-byte beacon block root");
    await fs.mkdir(dataDir, { recursive: true, mode: 0o700 });
    const saved = await fs.readFile(path.join(dataDir, "checkpoint")).catch(() => undefined);
    const seed = await fs.readFile(path.join(dataDir, "operator-checkpoint"), "utf8").catch(() => undefined);
    // A changed operator checkpoint explicitly reseeds the client. Otherwise prefer saved verified progress.
    const anchor =
      saved?.length === 32 && (!checkpoint || seed === checkpoint.toLowerCase())
        ? `0x${saved.toString("hex")}`
        : checkpoint;
    if (!anchor)
      throw new Error(
        "CHAIN VERIFICATION: set UPDATE_CHAIN_CHECKPOINT to a trusted recent mainnet beacon checkpoint before installing registry packages"
      );
    // Helios also reads this optional file. Refuse it so it cannot enable checkpoint fallback.
    const configExists = await fs.stat(path.join(os.homedir(), ".helios", "helios.toml")).then(
      () => true,
      (error) => {
        if (error.code === "ENOENT") return false;
        throw error;
      }
    );
    if (configExists) throw new Error("CHAIN VERIFICATION: remove the unmanaged ~/.helios/helios.toml configuration");
    const port = await unusedLoopbackPort();
    if (this.stopped) throw new Error("CHAIN VERIFICATION: light client is stopped");
    this.endpoint = `http://127.0.0.1:${port}`;
    // Do not inherit Helios CLI environment flags such as FALLBACK or LOAD_EXTERNAL_FALLBACK.
    const child = spawn(
      binary,
      [
        "ethereum",
        "--network",
        "mainnet",
        "--rpc-bind-ip",
        "127.0.0.1",
        "--rpc-port",
        String(port),
        "--data-dir",
        dataDir,
        "--checkpoint",
        anchor,
        "--execution-rpc",
        executionRpc,
        "--consensus-rpc",
        consensusRpc,
        "--strict-checkpoint-age"
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
        env: { PATH: process.env.PATH, RUST_LOG: "info", SSL_CERT_FILE: process.env.SSL_CERT_FILE }
      }
    );
    this.child = child;
    const log = (chunk: Buffer): void => {
      // Upstream URLs may contain credentials; do not publish them in logs.
      this.options.log(
        "info",
        `Update light client: ${chunk
          .toString()
          .trim()
          .replace(/https?:\/\/\S+/g, "[RPC URL]")}`
      );
    };
    child.stdout?.on("data", log);
    child.stderr?.on("data", log);
    child.on("error", () => {
      if (this.child === child) this.child = undefined;
      this.options.log("warn", "Update light client failed to start; check its binary and configuration");
    });
    child.on("exit", () => {
      if (this.child === child) this.child = undefined;
    });
    const deadline = Date.now() + (this.options.startupTimeoutMs ?? 30000);
    while (this.child === child && !this.stopped && Date.now() < deadline) {
      try {
        const block = (await this.send("eth_getBlockByNumber", ["finalized", false])) as { hash?: string } | null;
        if (block?.hash) {
          if (checkpoint) {
            const pending = path.join(dataDir, "operator-checkpoint.next");
            await fs.writeFile(pending, checkpoint.toLowerCase(), { mode: 0o600 });
            await fs.rename(pending, path.join(dataDir, "operator-checkpoint"));
          }
          this.options.log("info", "Update light client has a verified finalized block");
          return;
        }
      } catch {
        /* Wait for consensus synchronization, never switch to an unverified RPC. */
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(
      "CHAIN VERIFICATION: light client unavailable; check consensus/execution RPCs and refresh UPDATE_CHAIN_CHECKPOINT if expired"
    );
  }

  private async send(method: string, params: unknown[]): Promise<unknown> {
    const child = this.child;
    if (!child || child.exitCode !== null || this.stopped || !this.endpoint)
      throw new Error("CHAIN VERIFICATION: light client is unavailable");
    const id = ++this.requestId;
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error("CHAIN VERIFICATION: light client RPC failed");
    const body = (await response.json()) as { id?: number; error?: unknown; result?: unknown };
    if (child !== this.child || body.id !== id || body.error || !("result" in body)) {
      throw new Error("CHAIN VERIFICATION: light client rejected the request or its chain proof");
    }
    return body.result;
  }

  private async terminate(): Promise<void> {
    const child = this.child;
    this.child = undefined;
    if (!child || child.exitCode !== null) return;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
      }, 5000);
      child.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
      child.once("error", () => {
        clearTimeout(timer);
        resolve();
      });
      child.kill("SIGINT");
    });
  }
}

async function unusedLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}
