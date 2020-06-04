import { RootState } from "rootReducer";
import { autoUpdateIds } from "params";
import { createSelector } from "reselect";
import { getEthClientPrettyStatusError } from "components/EthMultiClient";

// Service > dappnodeStatus

// Sub-local properties
const getSystemInfo = (state: RootState) => state.dappnodeStatus.systemInfo;
export const getDappnodeParams = (state: RootState) => getSystemInfo(state);
export const getPasswordIsInsecure = (state: RootState) =>
  state.dappnodeStatus.passwordIsInsecure;
export const getAutoUpdateData = (state: RootState) =>
  state.dappnodeStatus.autoUpdateData;
export const getIdentityAddress = (state: RootState) =>
  (getSystemInfo(state) || {}).identityAddress;
export const getVolumes = (state: RootState) => state.dappnodeStatus.volumes;

// Sub-sub local properties
export const getEthClientTarget = (state: RootState) =>
  (getSystemInfo(state) || {}).ethClientTarget;
export const getEthClientFallback = (state: RootState) =>
  (getSystemInfo(state) || {}).ethClientFallback;
export const getEthClientStatus = (state: RootState) =>
  (getSystemInfo(state) || {}).ethClientStatus;
export const getNewFeatureIds = (state: RootState) =>
  (getSystemInfo(state) || {}).newFeatureIds;
export const getDappmanagerNaclPublicKey = (state: RootState) =>
  (getSystemInfo(state) || {}).dappmanagerNaclPublicKey;

/**
 * Returns a pretty warning about the eth client only if the user has to see it
 * @param state
 */
export const getEthClientWarning = (state: RootState): string | null => {
  const ethClientFallback = getEthClientFallback(state);
  const ethClientStatus = getEthClientStatus(state);
  if (ethClientStatus && !ethClientStatus.ok && ethClientFallback === "off")
    return getEthClientPrettyStatusError(ethClientStatus);
  else return null;
};

/**
 * Returns the DAppNode "network" identity to be shown in the TopBar
 * @returns {object} params = {
 *   name: "MyDappNode",
 *   staticIp: "85.84.83.82" (optional)
 *   domain: "ab318d2.dyndns.io" (optional, if no staticIp)
 *   ip: "85.84.83.82" (optional, if no staticIp)
 * }
 * [Tested]
 */
export const getDappnodeIdentityClean = (state: RootState) => {
  const systemInfo = getSystemInfo(state);
  if (systemInfo) {
    // If the static IP is set, don't show the regular IP
    const { ip, name, staticIp, domain } = systemInfo;
    if (staticIp) return { name, staticIp };
    else return { name, domain, ip };
  } else {
    return {};
  }
};

export const getStaticIp = (state: RootState) =>
  (getSystemInfo(state) || {}).staticIp || "";

export const getUpnpAvailable = (state: RootState) =>
  (getSystemInfo(state) || {}).upnpAvailable;

export const getIsWifiRunning = (state: RootState) =>
  (state.dappnodeStatus.wifiStatus || {}).running;

export const getIsCoreAutoUpdateActive = createSelector(
  getAutoUpdateData,
  autoUpdateData =>
    (
      ((autoUpdateData || {}).settings || {})[autoUpdateIds.SYSTEM_PACKAGES] ||
      {}
    ).enabled
);
