import { logs } from "@dappnode/logger";
import { ClientResult, DashboardSupportedNetwork, NodeStatusByNetwork } from "@dappnode/types";

/** Timeout in milliseconds for each individual client request group (EC or CC) */
const CLIENT_TIMEOUT_MS = 5_000;

const ecBaseUrl = (network: DashboardSupportedNetwork) => `http://execution.${network}.dncore.dappnode:8545`;
const ccBaseUrl = (network: DashboardSupportedNetwork) => `http://beacon-chain.${network}.dncore.dappnode:3500`;

/** Blocks the EC head may trail the execution block of the CC head and still count as synced */
const EC_HEAD_TOLERANCE_BLOCKS = 32;
/** Age of the EC head block after which the EC counts as behind, whatever eth_syncing says */
const EC_HEAD_MAX_AGE_SECONDS = 5 * 60;
/** Timeout for the optional requests that check the eth_syncing result */
const SYNC_CHECK_TIMEOUT_MS = 2_000;

/** Besu serves Prometheus metrics from the same container as its JSON-RPC */
const BESU_METRICS_PORT = 9545;
/** Blocks of tolerance between the head and Besu's snap sync pivot before the node is considered behind */
const BESU_PIVOT_TOLERANCE_BLOCKS = 128;

const ecMetricsUrl = (network: DashboardSupportedNetwork) =>
  `http://execution.${network}.dncore.dappnode:${BESU_METRICS_PORT}/metrics`;

export type EthSyncingResult = false | { startingBlock: string; currentBlock: string; highestBlock: string };
export type EcHead = { number: number; timestamp: number };
export type EcSyncStatus = { isSynced: boolean; currentBlock: number; progress: number };
export type BesuSnapSyncState = { pivotBlock: number; isWorldStateDownloaded: boolean };

const ecRpc = async <T>(network: DashboardSupportedNetwork, method: string, params: unknown[] = []): Promise<T> => {
  const response = await fetch(ecBaseUrl(network), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 })
  });
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(`${method} failed: ${data.error.message}`);
  }
  return data.result as T;
};

/** Percentage of `target` that `current` has reached, capped at 99 so the bar never reads 100% while syncing */
const progressTowards = (current: number, target: number): number =>
  Number.isFinite(current) && target > 0 ? Math.max(0, Math.min(99, Math.floor((current / target) * 100))) : 0;

/** Sync status while eth_syncing reports a sync in progress */
export function syncStatusFromEthSyncing(
  syncing: Exclude<EthSyncingResult, false>,
  ccExecutionHead: number | null
): EcSyncStatus {
  const startingBlock = parseInt(syncing.startingBlock, 16);
  const currentBlock = parseInt(syncing.currentBlock, 16);
  const highestBlock = parseInt(syncing.highestBlock, 16);

  let progress = 0;
  if (
    Number.isFinite(currentBlock) &&
    Number.isFinite(startingBlock) &&
    Number.isFinite(highestBlock) &&
    highestBlock > startingBlock
  ) {
    progress = ((currentBlock - startingBlock) / (highestBlock - startingBlock)) * 100;
    progress = Math.max(0, Math.min(100, Math.round(progress)));
  } else if (ccExecutionHead !== null) {
    // Some clients leave highestBlock unset in parts of their sync: the CC head is the target then
    progress = progressTowards(currentBlock, ccExecutionHead);
  }

  return { isSynced: false, currentBlock, progress };
}

/**
 * Sync status while eth_syncing reports false. Some clients do so before they reach the chain head
 * (Besu during snap sync), so the EC counts as synced only if its head is close to the CC head and recent.
 */
export function syncStatusFromHead(head: EcHead, ccExecutionHead: number | null, nowSeconds: number): EcSyncStatus {
  const currentBlock = head.number;
  const isBehindCc = ccExecutionHead !== null && ccExecutionHead - currentBlock > EC_HEAD_TOLERANCE_BLOCKS;
  const isHeadStale = nowSeconds - head.timestamp > EC_HEAD_MAX_AGE_SECONDS;

  if (isBehindCc || isHeadStale) {
    const progress = ccExecutionHead !== null ? progressTowards(currentBlock, ccExecutionHead) : 0;
    return { isSynced: false, currentBlock, progress };
  }
  return { isSynced: true, currentBlock, progress: 100 };
}

/**
 * Besu can report a recent head while it still downloads the world state, which only its metrics show.
 * Leaves the status as it is unless it says synced and the metrics say otherwise.
 */
export function applyBesuSnapSyncState(
  status: EcSyncStatus,
  snap: BesuSnapSyncState | null,
  ccExecutionHead: number | null
): EcSyncStatus {
  if (!status.isSynced || !snap || snap.pivotBlock <= 0) return status;
  const isBehindPivot = snap.pivotBlock - status.currentBlock > BESU_PIVOT_TOLERANCE_BLOCKS;
  if (snap.isWorldStateDownloaded && !isBehindPivot) return status;

  const target = Math.max(snap.pivotBlock, ccExecutionHead ?? 0);
  return { isSynced: false, currentBlock: status.currentBlock, progress: progressTowards(status.currentBlock, target) };
}

/** Reads one value from Prometheus text format. `name` must include the labels if the metric has any */
const readMetric = (metrics: string, name: string): number | null => {
  const line = metrics.split("\n").find((l) => l.startsWith(`${name} `));
  if (!line) return null;
  const value = parseFloat(line.slice(name.length + 1));
  return Number.isFinite(value) ? value : null;
};

/** Reads Besu's snap sync state from its Prometheus metrics. Null if the metrics do not have it */
export function parseBesuSnapSyncState(metrics: string): BesuSnapSyncState | null {
  const pivotBlock = readMetric(metrics, "besu_synchronizer_fast_sync_pivot_block_current");
  const worldStateCompleted = readMetric(
    metrics,
    'besu_synchronizer_sync_duration_count{name="SNAP_INITIAL_WORLD_STATE_DOWNLOAD_DURATION"}'
  );
  if (pivotBlock === null || worldStateCompleted === null) return null;
  return { pivotBlock, isWorldStateDownloaded: worldStateCompleted > 0 };
}

/** Returns null if the metrics are unavailable, so the caller keeps the status it has */
const getBesuSnapSyncState = async (network: DashboardSupportedNetwork): Promise<BesuSnapSyncState | null> => {
  try {
    const response = await fetch(ecMetricsUrl(network), { signal: AbortSignal.timeout(SYNC_CHECK_TIMEOUT_MS) });
    if (!response.ok) return null;
    return parseBesuSnapSyncState(await response.text());
  } catch {
    return null;
  }
};

/**
 * Execution block number of the CC head, the height a synced EC should be at.
 * Null if the CC cannot tell, e.g. it is unreachable or its head is from before the merge.
 */
const getCcExecutionHead = async (network: DashboardSupportedNetwork): Promise<number | null> => {
  try {
    const response = await fetch(`${ccBaseUrl(network)}/eth/v1/beacon/blinded_blocks/head`, {
      signal: AbortSignal.timeout(SYNC_CHECK_TIMEOUT_MS)
    });
    if (!response.ok) return null;
    const data = await response.json();
    const blockNumber = parseInt(data?.data?.message?.body?.execution_payload_header?.block_number, 10);
    return Number.isFinite(blockNumber) && blockNumber > 0 ? blockNumber : null;
  } catch {
    return null;
  }
};

const getEcHead = async (network: DashboardSupportedNetwork): Promise<EcHead> => {
  const block = await ecRpc<{ number: string; timestamp: string } | null>(network, "eth_getBlockByNumber", [
    "latest",
    false
  ]);
  if (!block) throw new Error("eth_getBlockByNumber returned no latest block");
  return { number: parseInt(block.number, 16), timestamp: parseInt(block.timestamp, 16) };
};

const getEcName = async (network: DashboardSupportedNetwork) => {
  const versionResponse = await fetch(ecBaseUrl(network), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "web3_clientVersion",
      params: [],
      id: 1
    })
  });

  if (!versionResponse.ok) {
    throw new Error(`HTTP error! Status: ${versionResponse.status}`);
  }
  const versionData = await versionResponse.json();
  const clientName = versionData.result.split("/")[0];

  return { name: clientName };
};

const getEcSyncStatus = async (network: DashboardSupportedNetwork, clientName: string): Promise<EcSyncStatus> => {
  const [syncing, ccExecutionHead] = await Promise.all([
    ecRpc<EthSyncingResult>(network, "eth_syncing"),
    getCcExecutionHead(network)
  ]);
  if (syncing !== false) return syncStatusFromEthSyncing(syncing, ccExecutionHead);

  const head = await getEcHead(network);
  const status = syncStatusFromHead(head, ccExecutionHead, Math.floor(Date.now() / 1000));
  if (!status.isSynced || !clientName.toLowerCase().includes("besu")) return status;
  return applyBesuSnapSyncState(status, await getBesuSnapSyncState(network), ccExecutionHead);
};

const getEcPeers = async (network: DashboardSupportedNetwork) => {
  const peersResponse = await fetch(ecBaseUrl(network), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "net_peerCount",
      params: [],
      id: 1
    })
  });
  if (!peersResponse.ok) {
    throw new Error(`HTTP error! Status: ${peersResponse.status}`);
  }
  const peersData = await peersResponse.json();
  return peersData.result ? parseInt(peersData.result, 16) : 0;
};
const getCcName = async (network: DashboardSupportedNetwork) => {
  const versionResponse = await fetch(`${ccBaseUrl(network)}/eth/v1/node/version`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (!versionResponse.ok) {
    throw new Error(`HTTP error! Status: ${versionResponse.status}`);
  }
  const versionData = await versionResponse.json();

  const clientName = versionData.data.version.split("/")[0];

  return { name: clientName };
};

// get also peers for the consensus clients

const getCcPeers = async (network: DashboardSupportedNetwork) => {
  const peersResponse = await fetch(`${ccBaseUrl(network)}/eth/v1/node/peer_count`);
  if (!peersResponse.ok) {
    throw new Error(`HTTP error! Status: ${peersResponse.status}`);
  }
  const peersData = await peersResponse.json();
  return peersData.data.connected;
};

const getCcSyncStatus = async (network: DashboardSupportedNetwork) => {
  // Standard endpoint for consensus client sync status (REST API, not JSON-RPC)
  const syncResponse = await fetch(`${ccBaseUrl(network)}/eth/v1/node/syncing`);
  if (!syncResponse.ok) {
    throw new Error(`HTTP error! Status: ${syncResponse.status}`);
  }
  const syncData = await syncResponse.json();
  const syncing = syncData.data;

  const isSynced = syncing.is_syncing === false;
  const headSlot = parseInt(syncing.head_slot, 10);
  const syncDistance = parseInt(syncing.sync_distance, 10);

  let progress = null;

  if (syncing.is_syncing === false) {
    progress = 100;
  } else {
    const highestSlot = headSlot + syncDistance;

    if (
      Number.isFinite(headSlot) &&
      Number.isFinite(syncDistance) &&
      Number.isFinite(highestSlot) &&
      highestSlot !== 0
    ) {
      progress = (headSlot / highestSlot) * 100;
      progress = Math.max(0, Math.min(100, Math.round(progress)));
    } else {
      progress = 0;
    }
  }

  return { isSynced, currentBlock: headSlot, progress };
};
const getEcData = async (network: DashboardSupportedNetwork): Promise<ClientResult> => {
  // The sync checks need several requests in a row, so the rest run alongside to stay within CLIENT_TIMEOUT_MS
  const [ecName, ecPeers] = await Promise.all([getEcName(network), getEcPeers(network)]);
  const ecSync = await getEcSyncStatus(network, ecName.name);

  return {
    name: ecName.name,
    isSynced: ecSync.isSynced,
    currentBlock: ecSync.currentBlock,
    progress: ecSync.progress,
    peers: ecPeers
  };
};

const getCcData = async (network: DashboardSupportedNetwork): Promise<ClientResult> => {
  const ccVersion = await getCcName(network);
  const ccSync = await getCcSyncStatus(network);
  const ccPeers = await getCcPeers(network);

  return {
    name: ccVersion.name,
    isSynced: ccSync.isSynced,
    currentBlock: ccSync.currentBlock,
    progress: ccSync.progress,
    peers: ccPeers
  };
};

/**
 * Wraps a client data fetch with a timeout. If the request exceeds
 * CLIENT_TIMEOUT_MS, it returns a ClientError instead of blocking.
 */
async function fetchClientWithTimeout(
  fetchFn: () => Promise<ClientResult>,
  network: DashboardSupportedNetwork
): Promise<ClientResult> {
  try {
    const result = await Promise.race([
      fetchFn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${CLIENT_TIMEOUT_MS}ms`)), CLIENT_TIMEOUT_MS)
      )
    ]);
    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logs.error(`Error fetching data for ${network}: ${message}`);
    return { error: `Failed to fetch RPC: ${message}` };
  }
}

export async function nodeStatusGetByNetwork({ networks }: { networks: DashboardSupportedNetwork[] }) {
  const resultsByNetwork: NodeStatusByNetwork = {};

  await Promise.all(
    networks.map(async (network) => {
      const [ec, cc] = await Promise.all([
        fetchClientWithTimeout(() => getEcData(network), network),
        fetchClientWithTimeout(() => getCcData(network), network)
      ]);
      resultsByNetwork[network] = { ec, cc };
    })
  );

  return resultsByNetwork;
}
