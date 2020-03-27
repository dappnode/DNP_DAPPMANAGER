import { ReturnData } from "../route-types/systemInfoGet";
import { RpcHandlerReturnWithResult } from "../types";
import * as db from "../db";
import versionData from "../utils/getVersionData";
import logPackage from "./logPackage";

const wifiName = "wifi.dnp.dappnode.eth";

/**
 * Returns the current DAppNode system info
 */
export default async function systemInfoGet(): RpcHandlerReturnWithResult<
  ReturnData
> {
  return {
    message: "Got system info",
    result: {
      // Git version data
      versionData,
      // Network params
      ip: db.publicIp.get(),
      name: db.serverName.get(),
      staticIp: db.staticIp.get(),
      domain: db.domain.get(),
      upnpAvailable: db.upnpAvailable.get(),
      noNatLoopback: db.noNatLoopback.get(),
      alertToOpenPorts: db.alertToOpenPorts.get(),
      internalIp: db.internalIp.get(),
      // Public key of nacl's asymmetric encryption, used by the ADMIN UI
      // to send sensitive data in a slightly more protected way
      dappmanagerNaclPublicKey: db.naclPublicKey.get(),
      // From seedPhrase: If it's not stored yet, it's an empty string
      identityAddress: db.identityAddress.get(),
      // Eth provider configured URL, if empty will default to WEB3_HOST
      ethClientTarget: db.ethClientTarget.get(),
      ethClientStatus: db.ethClientStatus.get(),
      ethClientFallback: db.ethClientFallback.get(),
      ethClientStatusError: db.ethClientStatusError.get(),
      ethProvider: db.ethProviderUrl.get(),
      // Domain map
      fullnodeDomainTarget: db.fullnodeDomainTarget.get(),
      // UI stats
      uiWelcomeStatus: db.uiWelcomeStatus.get()
    }
  };
}

/**
 * Get the logs of the WIFI package to check if it's running or not
 * `[Warning] No interface found. Entering sleep mode.`
 */
async function getIsWifiActive(): Promise<boolean> {
  try {
    const { result: logs } = await logPackage({
      id: wifiName,
      options: { timestamp: false, tail: 20 }
    });
    const firstLogLine = (logs || "").trim().split("\n")[0];
    return !firstLogLine || !firstLogLine.includes("No interface found");
  } catch (e) {
    return false;
  }
}
