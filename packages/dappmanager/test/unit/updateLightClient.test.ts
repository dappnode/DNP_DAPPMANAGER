import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { UpdateLightClient, type UpdateLightClientOptions } from "../../src/updateLightClient.js";

// A local helper fixture tests process ownership and checkpoint selection only.
// The pinned Helios Docker target separately tests real consensus and MPT verification.
const helper = `#!/usr/bin/env node
const fs = require('node:fs');
const http = require('node:http');
const args = process.argv.slice(2);
const option = name => args[args.indexOf(name) + 1];
const dir = option('--data-dir');
fs.writeFileSync(dir + '/launch.json', JSON.stringify({args, fallback: process.env.FALLBACK, external: process.env.LOAD_EXTERNAL_FALLBACK}));
fs.writeFileSync(dir + '/checkpoint', Buffer.from('44'.repeat(32), 'hex'));
const server = http.createServer((req, res) => {
 let text = ''; req.on('data', b => text += b); req.on('end', () => {
  const {id, method} = JSON.parse(text);
  if (method === 'test_exit') return process.exit(0);
  const result = method === 'eth_chainId' ? '0x1' : {hash: '0x' + 'ab'.repeat(32)};
  res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({jsonrpc:'2.0', id, result}));
 });
});
server.listen(Number(option('--rpc-port')), '127.0.0.1');
process.on('SIGINT', () => server.close(() => process.exit(0)));
`;

describe("Managed update light client", () => {
  let directory: string;
  const clients: UpdateLightClient[] = [];
  let options: UpdateLightClientOptions;
  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), "dappnode-verifier-"));
    const binary = path.join(directory, "helper.cjs");
    await fs.writeFile(binary, helper, { mode: 0o700 });
    options = {
      binary,
      dataDir: path.join(directory, "state"),
      checkpoint: `0x${"42".repeat(32)}`,
      consensusRpc: "https://consensus.example",
      executionRpc: "https://execution.example",
      log: () => undefined,
      startupTimeoutMs: 3000
    };
  });
  afterEach(async () => {
    await Promise.all(clients.splice(0).map((client) => client.stop()));
    await fs.rm(directory, { recursive: true, force: true });
  });
  function client(overrides: Partial<UpdateLightClientOptions> = {}) {
    const instance = new UpdateLightClient({ ...options, ...overrides });
    clients.push(instance);
    return instance;
  }
  async function launch() {
    return JSON.parse(await fs.readFile(path.join(options.dataDir, "launch.json"), "utf8")) as {
      args: string[];
      fallback?: string;
      external?: string;
    };
  }

  it("requires a configured trust anchor and rejects malformed checkpoints before starting", async () => {
    await assert.rejects(client({ checkpoint: "" }).request("eth_chainId", []), /set UPDATE_CHAIN_CHECKPOINT/);
    await assert.rejects(client({ checkpoint: "not-a-root" }).request("eth_chainId", []), /32-byte beacon block root/);
  });

  it("isolates CLI configuration, saves verified progress and honors an explicit checkpoint refresh", async () => {
    const previous = process.env.FALLBACK;
    process.env.FALLBACK = "https://must-not-be-inherited.example";
    try {
      const first = client();
      assert.deepEqual(await Promise.all([first.request("eth_chainId", []), first.request("eth_chainId", [])]), [
        "0x1",
        "0x1"
      ]);
      const initial = await launch();
      assert(initial.args.includes("--strict-checkpoint-age"));
      assert(!initial.args.includes("--load-external-fallback"));
      assert.equal(initial.fallback, undefined);
      assert.equal(initial.external, undefined);
      assert.equal(initial.args[initial.args.indexOf("--checkpoint") + 1], options.checkpoint);
      await first.stop();
      await assert.rejects(first.request("eth_chainId", []), /stopped/);

      const second = client();
      await second.request("eth_chainId", []);
      const restarted = await launch();
      assert.equal(restarted.args[restarted.args.indexOf("--checkpoint") + 1], `0x${"44".repeat(32)}`);
      await second.stop();

      const third = client({ checkpoint: `0x${"43".repeat(32)}` });
      await third.request("eth_chainId", []);
      const refreshed = await launch();
      assert.equal(refreshed.args[refreshed.args.indexOf("--checkpoint") + 1], `0x${"43".repeat(32)}`);
    } finally {
      if (previous === undefined) delete process.env.FALLBACK;
      else process.env.FALLBACK = previous;
    }
  });

  it("fails closed when its owned helper cannot start", async () => {
    await assert.rejects(
      client({ binary: path.join(directory, "missing") }).request("eth_chainId", []),
      /light client unavailable/
    );
  });
});
