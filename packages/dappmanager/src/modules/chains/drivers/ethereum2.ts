import fetch from "node-fetch";
import memoize from "memoizee";
import { getPrivateNetworkAlias } from "../../../domains";
import { urlJoin } from "../../../utils/url";
import { InstalledPackageData } from "../../../types";
import { ChainDataResult } from "../types";
import { safeProgress } from "../utils";

const beaconChainServiceName = "beacon-chain";
const MIN_SLOT_DIFF_SYNC = 60;

// Wait for Promises to resolve. Do not cache rejections
// Cache for 1 hour, genesis and config should never change
const fetchNodeSyncingMemo = memoize(fetchNodeSyncingStatus, {
  promise: true,
  maxAge: 3e6
});

/**
 * Returns a chain data object for an Ethereum 2.0 Prysm beacon chain node
 * @param apiUrl = "http://beacon-chain.prysm-pyrmont.dappnode:3500/"
 */
export async function ethereum2(
  dnp: InstalledPackageData
): Promise<ChainDataResult | null> {
  const beaconChainContainer = dnp.containers.find(
    container => container.serviceName === beaconChainServiceName
  );
  if (!beaconChainContainer) {
    throw Error(`${beaconChainServiceName} service not found`);
  }
  if (!beaconChainContainer.running) {
    return null; // OK to not be running, just ignore
  }

  const containerDomain = getPrivateNetworkAlias(beaconChainContainer);

  // http://beacon-chain.prysm-pyrmont.dappnode:3500/
  const apiUrl = `http://${containerDomain}:3500`;

  try {
    const nodeSyncing = await fetchNodeSyncingMemo(apiUrl);

    return parseNodeSyncingResponse(nodeSyncing);
  } catch (e) {
    // Retuturn error if cant fetch
    return {
      syncing: false,
      message: `Could not connect to RPC. ${e.message}`,
      error: true
    };
  }
}

/**
 * Parses the response from the beacon node to describe if it's currently syncing or not, and if it is, what block it is up to.
 */
export function parseNodeSyncingResponse(
  nodeSyncing: NodeSyncing
): ChainDataResult {
  // Return error if no data
  if (!nodeSyncing || !nodeSyncing.data)
    return {
      syncing: false,
      message: "No node syncing data",
      error: true,
      progress: 0
    };

  const { head_slot, sync_distance, is_syncing } = nodeSyncing.data;
  const headSlot = toNum(head_slot);
  const syncDistance = toNum(sync_distance);
  const highestBlock = headSlot + syncDistance;
  const progress = safeProgress(headSlot / highestBlock);

  if (syncDistance < MIN_SLOT_DIFF_SYNC) {
    // Return synced state
    return {
      syncing: false,
      error: false,
      message: `Synced #${headSlot}`
    };
  } else {
    // Return syncing state
    return {
      syncing: is_syncing,
      message: `Blocks synced ${headSlot} / ${highestBlock}`,
      progress: progress,
      error: false
    };
  }
}

/**
 * Requests the beacon node to describe if it's currently syncing or not, and if it is, what block it is up to.
 * https://ethereum.github.io/beacon-APIs/#/Node/getSyncingStatus
 */
async function fetchNodeSyncingStatus(baseUrl: string): Promise<NodeSyncing> {
  return await fetch(urlJoin(baseUrl, "/eth/v1/node/syncing")).then(res =>
    res.json()
  );
}

/**
 * Chain synced
 * ```
 * {
 *  "data":{
 *    "head_slot":"2310476",
 *    "sync_distance":"1",
 *    "is_syncing":false
 *   }
 * }
 * ```
 * Chain syncing
 * ```
 * {
 *  "data":{
 *    "head_slot":"696",
 *    "sync_distance":"2311112",
 *    "is_syncing":true
 *  }
 * }
 * ```
 */
interface NodeSyncing {
  data: {
    head_slot: string;
    sync_distance: string;
    is_syncing: boolean;
  };
}

// Utils

function toNum(numStr: string): number {
  const num = parseInt(numStr, 10);
  if (isNaN(num)) throw Error(`${numStr} is not a number`);
  return num;
}
