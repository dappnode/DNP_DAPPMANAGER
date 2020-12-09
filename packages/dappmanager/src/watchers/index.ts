import runAutoUpdates from "./autoUpdates";
import runDiskUsageWatcher from "./diskUsage";
import runDyndnsWatcher from "./dyndns";
import runEthMultiClientWatcher from "./ethMultiClient";
import runNatrenewal from "./natRenewal";
import runNsupdateWatcher from "./nsupdate";
import runVpnBridgeWatcher from "./vpnBridge";

export default function runWatchers(): void {
  runAutoUpdates();
  runDiskUsageWatcher();
  runDyndnsWatcher();
  runEthMultiClientWatcher();
  runNatrenewal();
  runNsupdateWatcher();
  runVpnBridgeWatcher();
}
