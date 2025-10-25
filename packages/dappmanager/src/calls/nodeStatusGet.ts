import { Network, NodeStatusByNetwork } from "@dappnode/types";

const ecBaseUrl = (network: Network) => `http://execution.${network}.dncore.dappnode:8545`;
const ccBaseUrl = (network: Network) => `http://beacon-chain.${network}.dncore.dappnode:3500`;

const getEcName = async (network: Network) => {
  try {
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
  } catch (e) {
    console.error(`Error getting EC version: ${e}`);
    return null;
  }
};

const getEcSyncStatus = async (network: Network) => {
  try {
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
      progress = ((currentBlock - startingBlock) / (highestBlock - startingBlock)) * 100;
      progress = Math.max(0, Math.min(100, Math.round(progress)));
    }

    return { isSynced, currentBlock, progress };
  } catch (e) {
    console.error(`Error getting EC data: ${e}`);
    return null;
  }
};

const getEcPeers = async (network: Network) => {
  try {
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
  } catch (error) {
    console.error(`Error getting EC peers: ${error}`);
    return null;
  }
};
const getCcName = async (network: Network) => {
  try {
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
  } catch (e) {
    console.error(`Error getting CC data: ${e}`);
    return null;
  }
};

// get also peers for the consensus clients

const getCcPeers = async (network: Network) => {
  try {
    const peersResponse = await fetch(`${ccBaseUrl(network)}/eth/v1/node/peer_count`);
    if (!peersResponse.ok) {
      throw new Error(`HTTP error! Status: ${peersResponse.status}`);
    }
    const peersData = await peersResponse.json();
    return peersData.data.connected;
  } catch (error) {
    console.error(`Error getting CC peers: ${error}`);
    return null;
  }
};

const getCcSyncStatus = async (network: Network) => {
  try {
    // Standard endpoint for consensus client sync status (REST API, not JSON-RPC)
    const syncResponse = await fetch(`${ccBaseUrl(network)}/eth/v1/node/syncing`);
    if (!syncResponse.ok) {
      throw new Error(`HTTP error! Status: ${syncResponse.status}`);
    }
    const syncData = await syncResponse.json();
    const syncing = syncData.data;
    console.log(`CC syncData for ${network}:`, syncData);

    const isSynced = syncing.is_syncing === false;
    const currentBlock = parseInt(syncing.head_slot, 10);

    let progress = null;

    if (syncing.is_syncing === false) {
      progress = 100;
    } else {
      // Calculate progress based on slots
      progress = 100;
    }

    console.log(`CC Sync Data for ${network}:`, { isSynced, currentBlock, progress });

    return { isSynced, currentBlock, progress };
  } catch (e) {
    console.error(`Error getting CC data: ${e}`);
    return null;
  }
};
const getEcData = async (network: Network) => {
  const ecName = await getEcName(network);
  const ecSync = await getEcSyncStatus(network);
  const ecPeers = await getEcPeers(network);

  if (!ecName || !ecSync || ecPeers === null) {
    return null;
  }

  return {
    name: ecName.name,
    isSynced: ecSync.isSynced,
    currentBlock: ecSync.currentBlock,
    progress: ecSync.progress,
    peers: ecPeers
  };
};

const getCcData = async (network: Network) => {
  const ccVersion = await getCcName(network);
  const ccSync = await getCcSyncStatus(network);
  const ccPeers = await getCcPeers(network);

  if (!ccVersion || !ccSync || ccPeers === null) {
    return null;
  }

  return {
    name: ccVersion.name,
    isSynced: ccSync.isSynced,
    currentBlock: ccSync.currentBlock,
    progress: ccSync.progress,
    peers: ccPeers
  };
};

export async function nodeStatusGetByNetwork({ networks }: { networks: Network[] }) {
  const resultsByNetwork: NodeStatusByNetwork = {};

  for (const network of networks) {
    const ec = await getEcData(network);
    const cc = await getCcData(network);
    resultsByNetwork[network] = { ec, cc };
  }

  return resultsByNetwork;
}
