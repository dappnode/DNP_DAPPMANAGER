import "./autoUpdates";
import "./chains";
import "./diskUsage";
import "./dyndns";
import runEthMultiClient from "./ethMultiClient";
import "./natRenewal";
import "./nsupdate";

export default function runWatchers(): void {
  runEthMultiClient();
}
