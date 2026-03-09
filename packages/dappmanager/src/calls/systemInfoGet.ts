import * as db from "@dappnode/db";
import { getVersionData } from "../utils/getVersionData.js";
import { NewFeatureId, SystemInfo } from "@dappnode/types";
import { isCoreUpdateEnabled } from "@dappnode/daemons";
import { params } from "@dappnode/params";

/**
 * Returns the current DAppNode system info
 */
export async function systemInfoGet(): Promise<SystemInfo> {
  return {
    // Git version data
    versionData: getVersionData().data,
    versionDataVpn: db.versionDataVpn.get(),
    // Network params
    ip: db.publicIp.get(),
    name: db.serverName.get(),
    dappnodeWebName: db.dappnodeWebName.get() || db.serverName.get(),
    staticIp: db.staticIp.get(),
    domain: db.domain.get(),
    upnpAvailable: db.upnpAvailable.get(),
    noNatLoopback: db.noNatLoopback.get(),
    alertToOpenPorts: db.alertToOpenPorts.get(),
    internalIp: db.internalIp.get(),
    // publicIp is used to check for internet connection after installation
    publicIp: db.publicIp.get(),
    ethRemoteRpc: "",
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

  // auto-updates: Show only if all are disabled
  if (!isCoreUpdateEnabled()) newFeatureIds.push("system-auto-updates");

  // enable-ethical-metrics: Disabled in the onboarding for now as we want to rethink how we present it
  // if (db.newFeatureStatus.get("enable-ethical-metrics") !== "seen") newFeatureIds.push("enable-ethical-metrics");

  // enable-notifications: Show only if not seen
  if (db.newFeatureStatus.get("enable-notifications") !== "seen") newFeatureIds.push("enable-notifications");

  // change-host-password: Show only if insecure and host scripts are enabled
  if (!db.passwordIsSecure.get() && !params.DISABLE_HOST_SCRIPTS) newFeatureIds.push("change-host-password");

  // Filter out features that the user has already seen or set
  return newFeatureIds.filter((featureId) => {
    const status = db.newFeatureStatus.get(featureId);
    return status !== "seen";
  });
}
