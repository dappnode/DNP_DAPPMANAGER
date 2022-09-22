import { AbortSignal } from "abort-controller";
import { startAutoUpdatesDaemon } from "./autoUpdates";
import { startDiskUsageDaemon } from "./diskUsage";
import { startDynDnsDaemon } from "./dyndns";
import { startEthMultiClientDaemon } from "./ethMultiClient";
import { startNatRenewalDaemon } from "./natRenewal";
import { startStakerConfigDaemon } from "./stakerConfig";
import { startTelegramBotDaemon } from "./telegramBot";

export function startDaemons(signal: AbortSignal): void {
  startAutoUpdatesDaemon(signal);
  startDiskUsageDaemon(signal);
  startDynDnsDaemon(signal);
  startEthMultiClientDaemon(signal);
  startNatRenewalDaemon(signal);
  startTelegramBotDaemon();
  startStakerConfigDaemon();
}
