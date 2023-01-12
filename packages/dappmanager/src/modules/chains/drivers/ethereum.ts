import { ethers } from "ethers";
import { InstalledPackageData } from "@dappnode/common";
import { whyDoesGethTakesSoMuchToSync } from "../../../externalLinks";
import { EthSyncing, parseEthersSyncing } from "../../../utils/ethers";
import { getPrivateNetworkAlias } from "../../../domains";
import { ChainDriverSpecs } from "@dappnode/dappnodesdk";
import { ChainDataResult } from "../types";
import { safeProgress } from "../utils";

const MIN_BLOCK_DIFF_SYNC = 60;
const gethSyncHelpUrl = whyDoesGethTakesSoMuchToSync;

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
    container => container.serviceName === serviceName
  );
  if (!executionLayerContainer) {
    throw Error(`${serviceName} service not found`);
  }
  if (!executionLayerContainer.running) {
    return null; // OK to not be running, just ignore
  }

  const port = chainDriver.portNumber || 8545; // grab specified port in chainDriver and use default port if none specified
  const containerDomain = getPrivateNetworkAlias(executionLayerContainer);

  const apiUrl = `http://${containerDomain}:${port}`;

  const provider = new ethers.providers.JsonRpcProvider(apiUrl);
  const [syncing, peersCount, blockNumber] = await Promise.all([
    provider.send("eth_syncing", []).then(parseEthersSyncing),
    provider.send("net_peerCount", []).then(parseInt),
    provider.getBlockNumber()
  ]);

  return parseEthereumState(syncing, blockNumber, peersCount);
}

/**
 * Parses is syncing return
 * Isolated in a pure function for testability
 */
export function parseEthereumState(
  syncing: EthSyncing,
  blockNumber: number,
  peersCount: number
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
      warpChunksAmount
    } = syncing;
    // Syncing but very close
    const currentBlockDiff = highestBlock - currentBlock;
    if (currentBlockDiff < MIN_BLOCK_DIFF_SYNC)
      return {
        syncing: false,
        error: false,
        message: `Synced #${blockNumber}`,
        peers: peersCount
      };

    // Geth sync with states
    if (typeof pulledStates === "number" && typeof knownStates === "number") {
      return {
        syncing: true,
        error: false,
        // Render multiline status in the UI
        message: [
          `Blocks synced: ${currentBlock} / ${highestBlock}`,
          `States synced: ${pulledStates} / ${knownStates}`
        ].join("\n\n"),
        help: gethSyncHelpUrl,
        peers: peersCount
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
        peers: peersCount
      };
    }

    // Return normal only blocks sync info
    return {
      syncing: true,
      error: false,
      message: `Blocks synced: ${currentBlock} / ${highestBlock}`,
      progress: safeProgress(currentBlock / highestBlock),
      peers: peersCount
    };
  } else {
    if (!blockNumber || blockNumber === 0) {
      // Some nodes on start may think they are synced at block 0 before discovering blocks
      return {
        syncing: true,
        error: false,
        message: `Syncing...`,
        progress: 0
      };
    } else {
      return {
        syncing: false,
        error: false,
        message: `Synced #${blockNumber}`,
        peers: peersCount
      };
    }
  }
}
