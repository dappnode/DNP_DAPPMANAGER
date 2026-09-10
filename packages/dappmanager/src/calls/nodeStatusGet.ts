import { logs } from "@dappnode/logger";
import { ClientResult, DashboardSupportedNetwork, NodeStatusByNetwork } from "@dappnode/types";

/** Timeout in milliseconds for each individual client request group (EC or CC) */
const CLIENT_TIMEOUT_MS = 5_000;

const ecBaseUrl = (network: DashboardSupportedNetwork) => `http://execution.${network}.dncore.dappnode:8545`;
const ccBaseUrl = (network: DashboardSupportedNetwork) => `http://beacon-chain.${network}.dncore.dappnode:3500`;

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

const getEcSyncStatus = async (network: DashboardSupportedNetwork) => {
  const syncResponse = await fetch(`${ecBaseUrl(network)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_syncing",
      params: [],
      id: 0
    })
  });
  if (!syncResponse.ok) {
    throw new Error(`HTTP error! Status: ${syncResponse.status}`);
  }

  const syncData = await syncResponse.json();
  const syncing = syncData.result;

  let isSynced = false;
  let currentBlock = null;
  let startingBlock = null;
  let highestBlock = null;
  let progress = null;

  if (syncing === false) {
    // Node is fully synced
    isSynced = true;
    // Get current block number
    const blockResponse = await fetch(`${ecBaseUrl(network)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1
      })
    });
    const blockData = await blockResponse.json();
    currentBlock = parseInt(blockData.result, 16);
    startingBlock = currentBlock;
    highestBlock = currentBlock;
    progress = 100;
  } else {
    // Node is syncing
    isSynced = false;
    startingBlock = parseInt(syncing.startingBlock, 16);
    currentBlock = parseInt(syncing.currentBlock, 16);
    highestBlock = parseInt(syncing.highestBlock, 16);

    if (
      Number.isFinite(currentBlock) &&
      Number.isFinite(startingBlock) &&
      Number.isFinite(highestBlock) &&
      highestBlock !== startingBlock
    ) {
      progress = ((currentBlock - startingBlock) / (highestBlock - startingBlock)) * 100;
      progress = Math.max(0, Math.min(100, Math.round(progress)));
    } else {
      progress = 0;
    }
  }

  return { isSynced, currentBlock, progress };
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
  const ecName = await getEcName(network);
  const ecSync = await getEcSyncStatus(network);
  const ecPeers = await getEcPeers(network);

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
