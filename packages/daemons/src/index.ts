import { DappnodeInstaller } from "@dappnode/installer";
import { startAutoUpdatesDaemon } from "./autoUpdates/index.js";
import { startDiskUsageDaemon } from "./diskUsage/index.js";
import { startDynDnsDaemon } from "./dyndns/index.js";
import { startEthicalMetricsDaemon } from "./ethicalMetrics/index.js";
import { startNatRenewalDaemon } from "./natRenewal/index.js";
import { startStakerDaemon } from "./stakerConfig/index.js";
import { startTelegramBotDaemon } from "./telegramBot/index.js";
import { startBindDaemon } from "./bind/index.js";
import { startInternetConnectionDaemon } from "./internetConnection/index.js";
import { startHostRebootDaemon } from "./hostReboot/index.js";
import { startRepositoryHealthDaemon } from "./repositoryHealth/index.js";
import { setMaxListeners } from "events"; // Import setMaxListeners
import { startDockerNetworkConfigsDaemon } from "./dockerNetworkConfigs/index.js";
import { Consensus, Execution, MevBoost, Signer } from "@dappnode/blockchains";

// DAEMONS EXPORT

export function startDaemons(
  dappnodeInstaller: DappnodeInstaller,
  execution: Execution,
  consensus: Consensus,
  signer: Signer,
  mevBoost: MevBoost,
  signal: AbortSignal
): void {
  // Increase the max listeners for AbortSignal. default is 10
  setMaxListeners(12, signal);

  startAutoUpdatesDaemon(dappnodeInstaller, signal);
  startDiskUsageDaemon(signal);
  startDynDnsDaemon(signal);
  startEthicalMetricsDaemon(dappnodeInstaller, signal);
  startNatRenewalDaemon(signal);
  startStakerDaemon(dappnodeInstaller);
  startTelegramBotDaemon();
  startBindDaemon(signal);
  startInternetConnectionDaemon(signal);
  startHostRebootDaemon(signal);
  startRepositoryHealthDaemon(signal);
  startDockerNetworkConfigsDaemon(signal, execution, consensus, signer, mevBoost);
}

export { startAvahiDaemon } from "./avahi/index.js";

export { throttledNatRenewal } from "./natRenewal/index.js";

export { getPortsToOpen } from "./natRenewal/getPortsToOpen.js";

// Auto updates exports
// TODO: find a proper place for auto-updates logic, consider creating a separated module

export * from "./autoUpdates/index.js";
