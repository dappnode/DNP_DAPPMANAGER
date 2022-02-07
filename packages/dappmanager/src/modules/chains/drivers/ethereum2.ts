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

    return parseEthereum2State(nodeSyncing);
  } catch (e) {
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
export function parseEthereum2State(nodeSyncing: NodeSyncing): ChainDataResult {
  if (!nodeSyncing || !nodeSyncing.data)
    return {
      syncing: false,
      message: "No node syncing data",
      error: true,
      progress: 0
    };

  const { head_slot, sync_distance, is_syncing } = nodeSyncing.data;
  const highestBlock = parseInt(head_slot) + parseInt(sync_distance);

  if (highestBlock - parseInt(head_slot) < MIN_SLOT_DIFF_SYNC) {
    return {
      syncing: false,
      error: false,
      message: `Synced #${head_slot}`
    };
  } else {
    return {
      syncing: is_syncing,
      message: `Blocks synced ${head_slot} / ${highestBlock}`,
      progress: safeProgress(parseInt(head_slot) / highestBlock),
      error: false
    };
  }
}

/**
 * Requests the beacon node to describe if it's currently syncing or not, and if it is, what block it is up to.
 * https://ethereum.github.io/beacon-APIs/#/Node/getSyncingStatus
 */
async function fetchNodeSyncingStatus(baseUrl: string): Promise<NodeSyncing> {
  const response: NodeSyncing = await fetchPrysmApi(
    baseUrl,
    "/eth/v1/node/syncing"
  );
  return response;
}

async function fetchPrysmApi<T>(baseUrl: string, apiPath: string): Promise<T> {
  return await fetch(urlJoin(baseUrl, apiPath)).then(res => res.json());
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
 * {"data":{"head_slot":"10445","sync_distance":"0","is_syncing":false}}
 */
interface NodeSyncing {
  data: {
    head_slot: string;
    sync_distance: string;
    is_syncing: boolean;
  };
}
