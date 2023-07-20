import { startAutoUpdatesDaemon } from "./autoUpdates/index.js";
import { startDiskUsageDaemon } from "./diskUsage/index.js";
import { startDynDnsDaemon } from "./dyndns/index.js";
import { startEthMultiClientDaemon } from "./ethMultiClient/index.js";
import { startNatRenewalDaemon } from "./natRenewal/index.js";
import { startNsUpdateDaemon } from "./nsupdate/index.js";
import { startStakerDaemon } from "./stakerConfig/index.js";
import { startStakerDbUpdateDaemon } from "./stakerDbUpdate/index.js";
import { startTelegramBotDaemon } from "./telegramBot/index.js";

export function startDaemons(signal: AbortSignal): void {
  startAutoUpdatesDaemon(signal);
  startDiskUsageDaemon(signal);
  startDynDnsDaemon(signal);
  startEthMultiClientDaemon(signal);
  startNatRenewalDaemon(signal);
  startNsUpdateDaemon(signal);
  startStakerDaemon();
  startStakerDbUpdateDaemon();
  startTelegramBotDaemon();
}
