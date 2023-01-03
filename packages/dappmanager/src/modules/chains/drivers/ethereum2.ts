import fetch from "node-fetch";
import { ChainDriverSpecs } from "@dappnode/dappnodesdk";
import { getPrivateNetworkAlias } from "../../../domains";
import { urlJoin } from "../../../utils/url";
import { InstalledPackageData } from "@dappnode/common";
import { ChainDataResult } from "../types";
import { safeProgress } from "../utils";

/**
 * Returns a chain data object for an Ethereum 2.0 Prysm beacon chain node
 * @param apiUrl = "http://beacon-chain.prysm-pyrmont.dappnode:3500/"
 */
export async function ethereum2(
  dnp: InstalledPackageData,
  chainDriver: ChainDriverSpecs
): Promise<ChainDataResult | null> {
  // 1. Get network alias from the beacon chain service (use the default beaconchain service name if not specified)
  const serviceName = chainDriver.serviceName || "beacon-chain";
  const beaconChainContainer = dnp.containers.find(
    container => container.serviceName === serviceName
  );
  if (!beaconChainContainer) {
    throw Error(`${serviceName} service not found`);
  }
  if (!beaconChainContainer.running) {
    return null; // OK to not be running, just ignore
  }

  const containerDomain = getPrivateNetworkAlias(beaconChainContainer);

  // 2. Get the port number from the beacon chain service (use the default beaconchain port number if not specified)
  const port = chainDriver.portNumber || 3500;

  // base URL for the beacon chain node (e.g http://beacon-chain.prysm-pyrmont.dappnode:3500/)
  const apiUrl = `http://${containerDomain}:${port}`;

  try {
    const [nodeSyncing, peersCount] = await Promise.all([
      fetchNodeSyncingStatus(apiUrl),
      fetchNodePeersCount(apiUrl).then(parseNodePeersCount)
    ]);

    return parseNodeSyncingResponse(nodeSyncing, peersCount);
  } catch (e) {
    // Retuturn error if cant fetch
    return {
      syncing: false,
      message: `Could not connect to RPC. ${e.message}`,
      error: true
    };
  }
}

function parseNodePeersCount(peersCount: NodePeersCount): number {
  if (!peersCount || !peersCount.data) return 0;
  return parseInt(peersCount.data.connected);
}

/**
 * Parses the response from the beacon node to describe if it's currently syncing or not, and if it is, what block it is up to.
 */
export function parseNodeSyncingResponse(
  nodeSyncing: NodeSyncing,
  peersCount: number
): ChainDataResult {
  const MIN_SLOT_DIFF_SYNC = 60;
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
      message: `Synced #${headSlot}`,
      peers: peersCount
    };
  } else {
    // Return syncing state
    return {
      syncing: is_syncing,
      message: `Blocks synced ${headSlot} / ${highestBlock}`,
      progress: progress,
      error: false,
      peers: peersCount
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
 * Requests the beacon node to describe the number of peers it is connected to.
 * https://ethereum.github.io/beacon-APIs/#/Node/getPeerCount
 */
async function fetchNodePeersCount(baseUrl: string): Promise<NodePeersCount> {
  return await fetch(urlJoin(baseUrl, "/eth/v1/node/peer_count")).then(res =>
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

/**
 * Request successful:
 * ```
 *  {
 *   "data": {
 *     "disconnected": "12",
 *     "connecting": "34",
 *     "connected": "56",
 *     "disconnecting": "5"
 *   }
 * }
 * ```
 */
interface NodePeersCount {
  data: {
    disconnected: string;
    connecting: string;
    connected: string;
    disconnecting: string;
  };
}

// Utils

function toNum(numStr: string): number {
  const num = parseInt(numStr, 10);
  if (isNaN(num)) throw Error(`${numStr} is not a number`);
  return num;
}
