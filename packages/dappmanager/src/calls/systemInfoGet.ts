import params from "../params";
import * as db from "../db";
import { packageLog } from "./packageLog";
import { getVersionData } from "../utils/getVersionData";
import * as autoUpdateHelper from "../utils/autoUpdateHelper";
import { NewFeatureId, SystemInfo } from "../types";

const wifiName = params.wifiDnpName;

/**
 * Returns the current DAppNode system info
 */
export async function systemInfoGet(): Promise<SystemInfo> {
  const ethClientTarget = db.ethClientTarget.get();

  return {
    // Git version data
    versionData: getVersionData().data,
    versionDataVpn: db.versionDataVpn.get(),
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
    ethClientTarget,
    ethClientStatus: ethClientTarget
      ? db.ethClientStatus.get(ethClientTarget)
      : null,
    ethClientFallback: db.ethClientFallback.get(),
    ethProvider: db.ethProviderUrl.get(),
    // Domain map
    fullnodeDomainTarget: db.fullnodeDomainTarget.get(),
    // UI stats
    newFeatureIds: getNewFeatureIds()
  };
}

/**
 * Compute which features to show
 * - repository: Show only if nothing is selected
 * - auto-updates: Show only if disabled
 * - change-host-password: Show only if insecure
 */
function getNewFeatureIds(): NewFeatureId[] {
  const newFeatureIds: NewFeatureId[] = [];

  if (db.ethClientTarget.get()) {
    // If the user does not has the fallback on and has not seen the full
    // repository view, show a specific one just asking for the fallback
    if (
      db.ethClientFallback.get() === "off" &&
      db.newFeatureStatus.get("repository") !== "seen"
    )
      newFeatureIds.push("repository-fallback");
  } else {
    // repository: Show only if nothing is selected
    newFeatureIds.push("repository");
  }

  // auto-updates: Show only if all are disabled
  if (!autoUpdateHelper.isCoreUpdateEnabled())
    newFeatureIds.push("system-auto-updates");

  // change-host-password: Show only if insecure
  if (!db.passwordIsSecure.get()) newFeatureIds.push("change-host-password");

  // Filter out features that the user has already seen or set
  return newFeatureIds.filter(featureId => {
    const status = db.newFeatureStatus.get(featureId);
    return status !== "seen";
  });
}

/**
 * Get the logs of the WIFI package to check if it's running or not
 * `[Warning] No interface found. Entering sleep mode.`
 */
async function getIsWifiActive(): Promise<boolean> {
  try {
    const logs = await packageLog({
      id: wifiName,
      options: { timestamps: false, tail: 20 }
    });
    const firstLogLine = (logs || "").trim().split("\n")[0];
    return !firstLogLine || !firstLogLine.includes("No interface found");
  } catch (e) {
    return false;
  }
}
