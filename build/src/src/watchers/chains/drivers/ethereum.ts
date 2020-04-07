import { ethers } from "ethers";
import { whyDoesGethTakesSoMuchToSync } from "../../../externalLinks";
import { ChainDataResult } from "../types";
import { EthSyncing, parseEthersSyncing, safeProgress } from "../utils";

const MIN_BLOCK_DIFF_SYNC = 60;
const gethSyncHelpUrl = whyDoesGethTakesSoMuchToSync;

/**
 * Returns a chain data object for an [ethereum] API
 * @param api = "http://geth.dappnode:8545"
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
export default async function ethereum(api: string): Promise<ChainDataResult> {
  const provider = new ethers.providers.JsonRpcProvider(api);
  const [syncing, blockNumber] = await Promise.all([
    provider.send("eth_syncing", []).then(parseEthersSyncing),
    provider.getBlockNumber()
  ]);

  return parseEthereumState(syncing, blockNumber);
}

/**
 * Parses is syncing return
 * Isolated in a pure function for testability
 */
export function parseEthereumState(
  syncing: EthSyncing,
  blockNumber: number
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
        message: "Synced #" + blockNumber
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
        help: gethSyncHelpUrl
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
        progress: safeProgress(warpChunksProcessed / warpChunksAmount)
      };
    }

    // Return normal only blocks sync info
    return {
      syncing: true,
      error: false,
      message: `Blocks synced: ${currentBlock} / ${highestBlock}`,
      progress: safeProgress(currentBlock / highestBlock)
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
        message: "Synced #" + blockNumber
      };
    }
  }
}
