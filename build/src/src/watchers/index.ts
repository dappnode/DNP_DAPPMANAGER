import "./autoUpdates";
import "./chains";
import "./diskUsage";
import "./dyndns";
import runEthMultiClient from "./ethMultiClient";
import "./natRenewal";
import "./nsupdate";
import runVpnBridge from "./vpnBridge";

export default function runWatchers(): void {
  runEthMultiClient();
  runVpnBridge();
}
