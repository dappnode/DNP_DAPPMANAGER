import { RootState } from "rootReducer";
import {
  getEthClientPrettyStatusError,
  getEthClientType
} from "components/EthMultiClient";
import { ChainData } from "@dappnode/common";
import { activateFallbackPath } from "pages/system/data";
import { getDnpInstalled } from "services/dnpInstalled/selectors";
import { wifiDnpName } from "params";

// Service > dappnodeStatus

// Sub-local properties
const getSystemInfo = (state: RootState) => state.dappnodeStatus.systemInfo;
export const getDappnodeParams = (state: RootState) => getSystemInfo(state);
export const getPasswordIsSecure = (state: RootState) =>
  state.dappnodeStatus.passwordIsSecure;
export const getIdentityAddress = (state: RootState) =>
  (getSystemInfo(state) || {}).identityAddress;
export const getVolumes = (state: RootState) => state.dappnodeStatus.volumes;

// Sub-sub local properties
export const getEthClientTarget = (state: RootState) =>
  (getSystemInfo(state) || {}).eth2ClientTarget;
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

export const getDappnodeName = (state: RootState) =>
  (getSystemInfo(state) || {}).dappnodeWebName || "";

export const getStaticIp = (state: RootState) =>
  (getSystemInfo(state) || {}).staticIp || "";

function isWifiFirstContainerRunning(state: RootState): boolean {
  const installedPackages = getDnpInstalled(state);
  const wifiDnp = installedPackages.find(dnp => dnp.dnpName === wifiDnpName);
  if (!wifiDnp) return false;

  const wifiContainer = wifiDnp.containers[0];
  if (!wifiContainer) return false;

  return wifiContainer.running;
}

export const getWifiStatus = (state: RootState) => ({
  isDefaultPassphrase:
    state.dappnodeStatus.wifiCredentials?.isDefaultPassphrase,
  isRunning: isWifiFirstContainerRunning(state),
  ssid: state.dappnodeStatus.wifiCredentials?.ssid
});

/**
 * Returns a partial ChainData object with repository source status
 * To be shown alongside other chain data
 * @param state
 */
export function getRepositorySourceChainItem(
  state: RootState
): ChainData | null {
  const repositoryResult = _getRepositorySourceChainItem(state);
  return repositoryResult
    ? {
        ...repositoryResult,
        dnpName: "repository-source",
        name: "Repository source",
        help: activateFallbackPath
      }
    : null;
}

function _getRepositorySourceChainItem(
  state: RootState
): Omit<ChainData, "dnpName"> | null {
  const target = getEthClientTarget(state);
  const fallback = getEthClientFallback(state);
  const status = getEthClientStatus(state);

  if (target === "remote") {
    // Remote selected
    // Remote | Ok
    return {
      error: false,
      syncing: false,
      message: "Remote: Ok"
    };
  } else {
    if (!status || !target) return null;
    const clientType = getEthClientType(target);
    if (status.ok) {
      // Using local ethclient
      // Full client | Ok
      return {
        error: false,
        syncing: false,
        message: `${clientType}: Ok`
      };
    } else {
      const prettyStatus = getEthClientPrettyStatusError(status);
      if (fallback === "on") {
        // Using fallback, local client off
        // Full client | fallback
        return {
          error: false,
          syncing: true,
          message: multiline(`${clientType}: using remote`, prettyStatus)
        };
      } else {
        // Error, not using anything
        // Full client | off
        return {
          error: true,
          syncing: false,
          message: multiline(`${clientType}: not available`, prettyStatus)
        };
      }
    }
  }
}

/**
 * Returns a valid markdown multiline string from individual rows
 * @param strings
 */
function multiline(...strings: string[]): string {
  return strings.join("\n\n");
}
