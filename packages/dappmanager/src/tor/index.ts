import { createConnection } from "net";
import { spawn } from "child_process";
import { logs } from "@dappnode/logger";

// Tor SOCKS5 proxy port
const TOR_SOCKS_PORT = 9050;

// Tor process reference for cleanup
let torProcess: ReturnType<typeof spawn> | null = null;

/**
 * Check if Tor SOCKS proxy is available on localhost:9050
 */
export function isTorAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port: TOR_SOCKS_PORT }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => {
      resolve(false);
    });
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * Start Tor daemon for anonymous metrics forwarding.
 * Spawns Tor as a background process and waits for SOCKS5 proxy to be ready.
 */
export async function startTor(): Promise<void> {
  return new Promise((resolve, reject) => {
    logs.info("Starting Tor daemon for anonymous metrics...");

    torProcess = spawn("tor", [], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false
    });

    let started = false;

    torProcess.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      // Tor logs "Bootstrapped 100%" when fully ready
      if (output.includes("Bootstrapped 100%") && !started) {
        started = true;
        logs.info("Tor daemon started successfully (SOCKS5 proxy on 127.0.0.1:9050)");
        resolve();
      }
    });

    torProcess.stderr?.on("data", (data: Buffer) => {
      logs.warn(`Tor stderr: ${data.toString().trim()}`);
    });

    torProcess.on("error", (err) => {
      logs.error("Failed to start Tor daemon", err);
      if (!started) reject(err);
    });

    torProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        logs.warn(`Tor daemon exited with code ${code}`);
      }
      torProcess = null;
    });

    // Timeout after 60 seconds if Tor doesn't start
    setTimeout(() => {
      if (!started) {
        logs.warn("Tor daemon startup timeout, continuing without waiting for full bootstrap");
        resolve();
      }
    }, 60000);
  });
}

/**
 * Stop the Tor daemon if running
 */
export function stopTor(): void {
  if (torProcess) {
    torProcess.kill();
    torProcess = null;
  }
}
