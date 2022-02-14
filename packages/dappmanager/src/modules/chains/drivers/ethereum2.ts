import fetch from "node-fetch";
import { getPrivateNetworkAlias } from "../../../domains";
import { urlJoin } from "../../../utils/url";
import { InstalledPackageData, ChainDriver } from "../../../types";
import { ChainDataResult } from "../types";
import { safeProgress } from "../utils";

/**
 * Returns a chain data object for an Ethereum 2.0 Prysm beacon chain node
 * @param apiUrl = "http://beacon-chain.prysm-pyrmont.dappnode:3500/"
 */
export async function ethereum2(
  dnp: InstalledPackageData,
  chainDriver: ChainDriver
): Promise<ChainDataResult | null> {
  // base URL for the beacon chain node (e.g http://beacon-chain.prysm-pyrmont.dappnode:3500/)
  const defaultBeaconChainServiceName = "beacon-chain";
  const defaultBeaconPortNumber = 3500;

  // 1. Get network alias from the beacon chain service (use the default beaconchain service name if not specified)
  const serviceName =
    chainDriver.ethereum2?.serviceName || defaultBeaconChainServiceName;
  const beaconChainContainer = dnp.containers.find(
    container => container.serviceName === serviceName
  );
  if (!beaconChainContainer) {
    throw Error(`${defaultBeaconChainServiceName} service not found`);
  }
  if (!beaconChainContainer.running) {
    return null; // OK to not be running, just ignore
  }
  const containerDomain = getPrivateNetworkAlias(beaconChainContainer);

  // 2. Get the port number from the beacon chain service (use the default beaconchain port number if not specified)
  const port = chainDriver.ethereum2?.portNumber || defaultBeaconPortNumber;

  // http://beacon-chain.prysm-pyrmont.dappnode:3500/
  const apiUrl = `http://${containerDomain}:${port}`;

  try {
    const nodeSyncing = await fetchNodeSyncingStatus(apiUrl);

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
