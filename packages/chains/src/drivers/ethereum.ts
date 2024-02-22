import fetch from "node-fetch";
import {
  AddEthereumChainParameter,
  ChainDriverSpecs,
  InstalledPackageData,
} from "@dappnode/types";
import {
  buildNetworkAlias,
  EthSyncing,
  parseEthersSyncing,
} from "@dappnode/utils";
import { ChainDataResult } from "../types.js";
import { safeProgress } from "../utils.js";

const MIN_BLOCK_DIFF_SYNC = 60;
const gethSyncHelpUrl =
  "https://github.com/ethereum/go-ethereum/issues/16218#issuecomment-371454280";

/**
 * Returns a chain data object for an [ethereum] API
 * @returns
 * - On success: {
 *   syncing: true, {bool}
 *   message: "Blocks synced: 543000 / 654000", {string}
 *   progress: 0.83027522935,
 * }
 * - On error: {
 *   message: "Could not connect to RPC", {string}
 *   error: true {bool},
 * }
 */
export async function ethereum(
  dnp: InstalledPackageData,
  chainDriver: ChainDriverSpecs
): Promise<ChainDataResult | null> {
  // Get serviceName from chainDriverSpec and use normal method if no serviceName is defined in chainDriver
  const serviceName = chainDriver.serviceName || dnp.containers[0].serviceName;
  const executionLayerContainer = dnp.containers.find(
    (container) => container.serviceName === serviceName
  );
  if (!executionLayerContainer) {
    throw Error(`${serviceName} service not found`);
  }
  if (!executionLayerContainer.running) {
    return null; // OK to not be running, just ignore
  }

  const port = chainDriver.portNumber || 8545; // grab specified port in chainDriver and use default port if none specified

  const { dnpName } = executionLayerContainer;
  const containerDomain = buildNetworkAlias({
    dnpName,
    serviceName,
    isMainOrMonoservice: true,
  });

  const apiUrl = `http://${containerDomain}:${port}`;

  async function fetchJsonRpc(method: string, params = []) {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: method,
        params: params,
        id: 1,
      }),
    });
    const data = (await response.json()) as any;
    return data.result;
  }

  // Ethereum RPC spec https://ethereum.github.io/execution-apis/api-documentation/
  const [syncing, peersCount, blockNumber, chainId] = await Promise.all([
    fetchJsonRpc("eth_syncing").then(parseEthersSyncing), // Make sure parseEthersSyncing is compatible with direct JSON-RPC responses
    fetchJsonRpc("net_peerCount")
      .then((result) => parseInt(result, 16))
      .catch(() => undefined),
    fetchJsonRpc("eth_blockNumber").then((result) => parseInt(result, 16)),
    fetchJsonRpc("eth_chainId").then((result) => parseInt(result, 16)),
  ]);

  return {
    ...parseEthereumState(syncing, blockNumber, peersCount),
    wallet: getEthereumChainParameters(chainId, apiUrl),
  };
}

/**
 * Parses is syncing return
 * Isolated in a pure function for testability
 */
export function parseEthereumState(
  syncing: EthSyncing,
  blockNumber: number,
  peersCount?: number
): ChainDataResult {
  if (syncing) {
    const {
      // Generic syncing response
      currentBlock,
      highestBlock,
      // Geth variables
      pulledStates,
      knownStates,
      // Open Ethereum variables
      warpChunksProcessed,
      warpChunksAmount,
    } = syncing;
    // Syncing but very close
    const currentBlockDiff = highestBlock - currentBlock;
    if (currentBlockDiff < MIN_BLOCK_DIFF_SYNC)
      return {
        syncing: false,
        error: false,
        message: `Synced #${blockNumber}`,
        peers: peersCount,
      };

    // Geth sync with states
    if (typeof pulledStates === "number" && typeof knownStates === "number") {
      return {
        syncing: true,
        error: false,
        // Render multiline status in the UI
        message: [
          `Blocks synced: ${currentBlock} / ${highestBlock}`,
          `States synced: ${pulledStates} / ${knownStates}`,
        ].join("\n\n"),
        help: gethSyncHelpUrl,
        peers: peersCount,
      };
    }

    // Open Ethereum sync
    if (
      typeof warpChunksProcessed === "number" &&
      typeof warpChunksAmount === "number"
    ) {
      return {
        syncing: true,
        error: false,
        message: `Syncing snapshot: ${warpChunksProcessed} / ${warpChunksAmount}`,
        progress: safeProgress(warpChunksProcessed / warpChunksAmount),
        peers: peersCount,
      };
    }

    // Return normal only blocks sync info
    return {
      syncing: true,
      error: false,
      message: `Blocks synced: ${currentBlock} / ${highestBlock}`,
      progress: safeProgress(currentBlock / highestBlock),
      peers: peersCount,
    };
  } else {
    if (!blockNumber || blockNumber === 0) {
      // Some nodes on start may think they are synced at block 0 before discovering blocks
      return {
        syncing: true,
        error: false,
        message: `Syncing...`,
        progress: 0,
      };
    } else {
      return {
        syncing: false,
        error: false,
        message: `Synced #${blockNumber}`,
        peers: peersCount,
      };
    }
  }
}

function getEthereumChainParameters(
  chainId: number,
  rpcUrl: string
): AddEthereumChainParameter {
  switch (chainId) {
    case 1:
      return {
        chainId: "0x1",
        chainName: "Ethereum Mainnet",
        nativeCurrency: {
          name: "Ethereum",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: ["https://geth.dappnode.eth"], // [rpcUrl],
        blockExplorerUrls: ["https://etherscan.io"],
      };
    case 5:
      return {
        chainId: "0x5",
        chainName: "Goerli Testnet",
        nativeCurrency: {
          name: "Goerli Ether",
          symbol: "GTH",
          decimals: 18,
        },
        rpcUrls: [rpcUrl],
        blockExplorerUrls: ["https://goerli.etherscan.io"],
      };
    case 42:
      return {
        chainId: "0x2a",
        chainName: "Lukso Mainnet",
        nativeCurrency: {
          name: "Lukso token",
          symbol: "LYX",
          decimals: 18,
        },
        rpcUrls: [rpcUrl],
        blockExplorerUrls: ["https://explorer.execution.mainnet.lukso.network"],
      };
    case 100:
      return {
        chainId: "0x64",
        chainName: "Gnosis Chain",
        nativeCurrency: {
          name: "XDAI",
          symbol: "XDAI",
          decimals: 18,
        },
        rpcUrls: [rpcUrl],
        blockExplorerUrls: ["https://gnosisscan.io/"],
      };
    case 17000:
      return {
        chainId: "0x4268",
        chainName: "Holesky",
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: [rpcUrl],
        blockExplorerUrls: ["https://holesky.etherscan.io"],
      };
    default:
      return {
        chainId: `0x${chainId.toString(16)}`,
        chainName: `Chain ID ${chainId}`,
        rpcUrls: [rpcUrl],
      };
  }
}
