import { RootState } from "rootReducer";
import { getDnpInstalled } from "services/dnpInstalled/selectors";
import { wifiDnpName } from "params";

// Service > dappnodeStatus

// Sub-local properties
const getSystemInfo = (state: RootState) => state.dappnodeStatus.systemInfo;
export const getDappnodeParams = (state: RootState) => getSystemInfo(state);
export const getVolumes = (state: RootState) => state.dappnodeStatus.volumes;
export const getShouldShowSmooth = (state: RootState) => state.dappnodeStatus.shouldShowSmooth;

// Sub-sub local properties
export const getNewFeatureIds = (state: RootState) => (getSystemInfo(state) || {}).newFeatureIds;

/**
 * Returns the DAppNode "network" identity to be shown in the TopBar
 * @returns params = {
 *   name: "MyDappNode",
 *   staticIp: "85.84.83.82" (optional)
 *   domain: "ab318d2.dyndns.io" (optional, if no staticIp)
 *   ip: "85.84.83.82" (optional, if no staticIp)
 * }
 */
export const getDappnodeIdentityClean = (state: RootState) => {
  const systemInfo = getSystemInfo(state);
  if (systemInfo) {
    // Show all info always
    return {
      name: systemInfo.dappnodeWebName,
      domain: systemInfo.domain,
      ip: systemInfo.staticIp || systemInfo.ip,
      // Internal IP is very useful for debugging networking issues
      internalIp: systemInfo.internalIp
    };
  } else {
    return {};
  }
};

export const getDappnodeName = (state: RootState) => (getSystemInfo(state) || {}).dappnodeWebName || "";

export const getStaticIp = (state: RootState) => (getSystemInfo(state) || {}).staticIp || "";

function isWifiFirstContainerRunning(state: RootState): boolean {
  const installedPackages = getDnpInstalled(state);
  const wifiDnp = installedPackages.find((dnp) => dnp.dnpName === wifiDnpName);
  if (!wifiDnp) return false;

  const wifiContainer = wifiDnp.containers[0];
  if (!wifiContainer) return false;

  return wifiContainer.running;
}

export const getWifiStatus = (state: RootState) => ({
  isDefaultPassphrase: state.dappnodeStatus.wifiCredentials?.isDefaultPassphrase,
  isRunning: isWifiFirstContainerRunning(state),
  ssid: state.dappnodeStatus.wifiCredentials?.ssid
});
