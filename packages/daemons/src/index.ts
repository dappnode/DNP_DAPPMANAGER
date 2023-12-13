import { DappnodeInstaller } from "@dappnode/installer";
import { startAutoUpdatesDaemon } from "./autoUpdates/index.js";
import { startDiskUsageDaemon } from "./diskUsage/index.js";
import { startDynDnsDaemon } from "./dyndns/index.js";
import { startEthMultiClientDaemon } from "./ethMultiClient/index.js";
import { startEthicalMetricsDaemon } from "./ethicalMetrics/index.js";
import { startNatRenewalDaemon } from "./natRenewal/index.js";
import { startStakerDaemon } from "./stakerConfig/index.js";
import { startTelegramBotDaemon } from "./telegramBot/index.js";

// DAEMONS EXPORT

export function startDaemons(
  dappnodeInstaller: DappnodeInstaller,
  signal: AbortSignal
): void {
  startAutoUpdatesDaemon(dappnodeInstaller, signal);
  startDiskUsageDaemon(signal);
  startDynDnsDaemon(signal);
  startEthMultiClientDaemon(dappnodeInstaller, signal);
  startEthicalMetricsDaemon(dappnodeInstaller, signal);
  startNatRenewalDaemon(signal);
  startStakerDaemon(dappnodeInstaller);
  startTelegramBotDaemon();
}

export { startAvahiDaemon } from "./avahi/index.js";

export { throttledNatRenewal } from "./natRenewal/index.js";

export { getPortsToOpen } from "./natRenewal/getPortsToOpen.js";

// Auto updates exports
// TODO: find a proper place for auto-updates logic, consider creating a separated module

export * from "./autoUpdates/index.js";
