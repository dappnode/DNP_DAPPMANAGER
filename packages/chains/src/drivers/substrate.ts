import fetch from "node-fetch";
import { buildNetworkAlias, urlJoin } from "@dappnode/utils";
import { ChainDriverSpecs, InstalledPackageData } from "@dappnode/types";
import { ChainDataResult } from "../types.js";
import { safeProgress } from "../utils.js";

/**
 * Returns a chain data object for a Substrate node
 * @param apiUrl = "http://substrate.dnp.dappnode:9933/"
 */
export async function substrate(
  dnp: InstalledPackageData,
  chainDriver: ChainDriverSpecs
): Promise<ChainDataResult | null> {
  // 1. Get network alias from the Substrate service (use the default service name if not specified)
  const serviceName = chainDriver.serviceName || "substrate";
  const substrateContainer = dnp.containers.find(
    (container) => container.serviceName === serviceName
  );
  if (!substrateContainer) {
    throw Error(`${serviceName} service not found`);
  }
  if (!substrateContainer.running) {
    return null; // OK to not be running, just ignore
  }

  const { dnpName } = substrateContainer;
  const containerDomain = buildNetworkAlias({
    dnpName,
    serviceName,
    isMainOrMonoservice: false,
  });

  // 2. Get the port number from the Substrate service (use the default port number if not specified)
  const port = chainDriver.portNumber || 9933;

  // base URL for the Substrate node (e.g http://substrate.dnp.dappnode:9933/)
  const apiUrl = `http://${containerDomain}:${port}`;

  try {
    const [parachainSyncData, relaychainSyncData, peersCount] = await Promise.all([
      fetchSubstrateSyncData(`${apiUrl}/parachain`),
      fetchSubstrateSyncData(`${apiUrl}/relaychain`),
      fetchSubstratePeersCount(apiUrl),
    ]);

    return parseSubstrateSyncResponse(parachainSyncData, relaychainSyncData, peersCount);
  } catch (e) {
    // Return error if can't fetch
    return {
      syncing: false,
      message: `Could not connect to RPC. ${e.message}`,
      error: true,
    };
  }
}

/**
 * Fetches the sync state data for a Substrate chain (parachain or relaychain)
 * @param apiUrl The base URL for the Substrate node RPC (e.g. http://substrate.dnp.dappnode:9933/parachain)
 */
async function fetchSubstrateSyncData(apiUrl: string): Promise<SubstrateSyncData> {
  const requestBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "system_syncState",
    params: [],
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  return data.result as SubstrateSyncData;
}

/**
 * Fetches the number of connected peers for a Substrate node
 * @param apiUrl The base URL for the Substrate node RPC (e.g. http://substrate.dnp.dappnode:9933/)
 */
async function fetchSubstratePeersCount(apiUrl: string): Promise<number> {
  const requestBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "system_peers",
    params: [],
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  return data.result.length;
}

/**
 * Parses the sync state response from a Substrate node to describe if it's currently syncing or not,
 * and if it is, what block it is up to for both the parachain and relaychain.
 * @param parachainSyncData The sync state data for the parachain
 * @param relaychainSyncData The sync state data for the relaychain
 * @param peersCount The number of connected peers
 */
function parseSubstrateSyncResponse(
  parachainSyncData: SubstrateSyncData,
  relaychainSyncData: SubstrateSyncData,
  peersCount: number
): ChainDataResult {
  const parachainSyncing = !parachainSyncData.currentBlock.eq(parachainSyncData.highestBlock);
  const relaychainSyncing = !relaychainSyncData.currentBlock.eq(relaychainSyncData.highestBlock);

  const syncing = parachainSyncing || relaychainSyncing;
  const progress = safeProgress(
    parachainSyncData.currentBlock.toNumber() / parachainSyncData.highestBlock.toNumber()
  );

  return {
    syncing,
    error: false,
    message: syncing
      ? `Syncing parachain blocks ${parachainSyncData.currentBlock} / ${parachainSyncData.highestBlock}, relaychain blocks ${relaychainSyncData.currentBlock} / ${relaychainSyncData.highestBlock}`
      : `Synced parachain #${parachainSyncData.currentBlock}, relaychain #${relaychainSyncData.currentBlock}`,
    progress,
    peers: peersCount,
  };
}

/**
 * Interface describing the sync state data returned by a Substrate node
 */
interface SubstrateSyncData {
  currentBlock: any;
  highestBlock: any;
}