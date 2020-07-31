import { RootState } from "rootReducer";
import { isEmpty } from "lodash";
import { ChainData } from "types";
import {
  getEthClientStatus,
  getEthClientFallback,
  getEthClientTarget
} from "services/dappnodeStatus/selectors";
import {
  getEthClientPrettyStatusError,
  getEthClientType
} from "components/EthMultiClient";
import { activateFallbackPath } from "pages/system/data";

// Service > chainData

export const getChainData = (state: RootState): ChainData[] => {
  // Legacy check, may not be necessary
  // Make sure all chainData objects exist and are populated
  const chains = state.chainData.filter(data => data && !isEmpty(data));

  // Add repository mode chain item
  const repositoryResult = getRepositorySourceChainItem(state);
  if (repositoryResult) {
    return [
      {
        ...repositoryResult,
        dnpName: "repository-source",
        name: "Repository source",
        help: activateFallbackPath
      },
      ...chains
    ];
  } else {
    return chains;
  }
};

/**
 * Returns a partial ChainData object with repository source status
 * To be shown alongside other chain data
 * @param state
 */
function getRepositorySourceChainItem(
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
