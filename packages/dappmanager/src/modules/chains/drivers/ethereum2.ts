import fetch from "node-fetch";
import memoize from "memoizee";
import { getPrivateNetworkAlias } from "../../../domains";
import { urlJoin } from "../../../utils/url";
import { InstalledPackageData } from "../../../types";
import { ChainDataResult } from "../types";

const beaconChainServiceName = "beacon-chain";

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

  const nodeSyncing = await fetchNodeSyncingMemo(apiUrl);

  return parseEthereum2State(nodeSyncing);
}

/**
 * Compute the current clock slot from the genesis time itself.
 * Then, you can use localhost:3500/eth/v1alpha1/beacon/chainhead
 * and use headSlot. Then you can produce
 *
 * X slots synced / Y slot total =
 * currentHeadSlot / computeSlot(Date.now - genesisTime)
 */
export function parseEthereum2State(
  nodeSyncing: NodeSyncing
): ChainDataResult {}

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
 * ```
 * {
 *  "data":{
 *      "head_slot":"2310476",
 *      "sync_distance":"1",
 *      "is_syncing":false
 *    }
 * }
 */
interface NodeSyncing {
  data: {
    head_slot: string;
    sync_distance: string;
    is_syncing: boolean;
  };
}
