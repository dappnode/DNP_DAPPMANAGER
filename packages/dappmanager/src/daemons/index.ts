import { AbortSignal } from "abort-controller";
import { startAutoUpdatesDaemon } from "./autoUpdates";
import { startAvahiDaemon } from "./avahi";
import { startDiskUsageDaemon } from "./diskUsage";
import { startDynDnsDaemon } from "./dyndns";
import { startEthMultiClientDaemon } from "./ethMultiClient";
import { startNatRenewalDaemon } from "./natRenewal";
import { startNsUpdateDaemon } from "./nsupdate";
import { startTelegramBotDaemon } from "./telegramBot";
import { startVpnBridgeDaemon } from "./vpnBridge";

export function startDaemons(signal: AbortSignal): void {
  startAutoUpdatesDaemon(signal);
  startAvahiDaemon();
  startDiskUsageDaemon(signal);
  startDynDnsDaemon(signal);
  startEthMultiClientDaemon(signal);
  startNatRenewalDaemon(signal);
  startNsUpdateDaemon(signal);
  startVpnBridgeDaemon();
  startTelegramBotDaemon();
}
