import { ethers } from "ethers";
import * as db from "../../db";
import params from "../../params";
import { getMultiClientStatus } from "./clientStatus";
import { EthClientStatusError } from "@dappnode/common";
import { emitSyncedNotification } from "./syncedNotification";
import { ethereumClient } from ".";

export class EthProviderError extends Error {}

/**
 * Returns the url of the JSON RPC an Eth multi-client status and target
 * If the package target is not active it returns the remote URL
 * @returns initialized ethers instance
 */
export async function getEthersProvider(): Promise<ethers.providers.JsonRpcProvider> {
  const url = await getEthProviderUrl();
  // Store (just for UI / info purposes) the latest used url
  db.ethProviderUrl.set(url);
  return new ethers.providers.JsonRpcProvider(url);
}

/**
 * Returns the url of the JSON RPC an Eth multi-client status and target
 * If the package target is not active it returns the remote URLs
 * @returns ethProvier http://geth.dappnode:8545
 */
export async function getEthProviderUrl(): Promise<string> {
  if (params.ETH_MAINNET_RPC_URL_OVERRIDE)
    return params.ETH_MAINNET_RPC_URL_OVERRIDE;

  const target = ethereumClient.computeEthereumTarget();
  const fallback = db.ethClientFallback.get();

  // Initial case where the user has not selected any client yet
  if (!target) throw new EthProviderError(`No ethereum client selected yet`);

  // Remote is selected, just return remote
  if (target === "remote") return params.ETH_MAINNET_RPC_URL_REMOTE;

  // Full node is selected, ensure client is not empty
  if (!target.execClient) throw Error("No execution client selected yet");
  if (!target.consClient) throw Error("No consensus client selected yet");

  const status = await getMultiClientStatus(
    target.execClient,
    target.consClient
  );
  db.ethExecClientStatus.set(target.execClient, status);
  emitSyncedNotification(target, status);

  if (status.ok) {
    // Package test succeeded return its url
    return status.url;
  } else {
    if (fallback === "on") {
      // Fallback on, ignore error and return remote
      return params.ETH_MAINNET_RPC_URL_REMOTE;
    } else {
      // Fallback off, throw nice error
      const message = parseClientStatusError(status);
      throw new EthProviderError(`Node not available: ${message}`);
    }
  }
}

/**
 * Parse client status errors to a single string line
 *
 * Note: MUST NOT have undefined as a valid return type so typescript
 *       enforces that all possible states are covered
 */
function parseClientStatusError(statusError: EthClientStatusError): string {
  switch (statusError.code) {
    case "UNKNOWN_ERROR":
      return `Unknown error: ${statusError.error.message}`;

    case "STATE_NOT_SYNCED":
      return "State is not synced";

    case "STATE_CALL_ERROR":
      return `State call error: ${statusError.error.message}`;

    case "IS_SYNCING":
      return "Is syncing";

    case "NOT_AVAILABLE":
      return `Not available: ${statusError.error.message}`;

    case "NOT_RUNNING":
      return "Not running";

    case "NOT_INSTALLED":
      return "Not installed";

    case "INSTALLING":
      return "Is installing";

    case "INSTALLING_ERROR":
      return `Install error: ${statusError.error.message}`;

    case "UNINSTALLED":
      return `Package is uninstalled`;
  }
}
