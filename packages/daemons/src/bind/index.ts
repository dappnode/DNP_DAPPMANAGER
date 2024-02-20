import { params } from "@dappnode/params";
import { runAtMostEvery } from "@dappnode/utils";
import { ensureBindComposeIp } from "./ensureBindComposeIp.js";
import { ensureBindContainerIpAndRunning } from "./ensureBindContainerIpAndRunning.js";
import { logs } from "@dappnode/logger";

/**
 * Ensures the Bind the docker network config is correct:
 * - bind compose has right IP
 * - bind container has right IP
 * - bind container running
 */
async function ensureBindNetworkConfig(): Promise<void> {
  try {
    ensureBindComposeIp();
    await ensureBindContainerIpAndRunning();
  } catch (e) {
    logs.warn("Error ensuring bind network config", e);
  }
}

/**
 * BIND daemon to ensure the network config is correct
 */
export function startBindDaemon(signal: AbortSignal): void {
  runAtMostEvery(
    async () => ensureBindNetworkConfig(),
    params.BIND_DAEMON_INTERVAL,
    signal,
    1000 * 10 // initial delay
  );
}
