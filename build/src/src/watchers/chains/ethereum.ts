// #### NOTE: Typedefinitions of web3.eth.isSyncing() are not correct, using require to ignore them
import { ethers } from "ethers";
import { ChainData } from "../../types";
import { whyDoesGethTakesSoMuchToSync } from "../../externalLinks";

const MIN_BLOCK_DIFF_SYNC = 60;
const gethSyncHelpUrl = whyDoesGethTakesSoMuchToSync;

type EthSyncingReturn =
  | false
  | {
      currentBlock: string; // "0x0";
      highestBlock: string; // "0x8a61c8";
      startingBlock: string; // "0x0";
      // Geth sync
      knownStates?: string | null; // "0x1266";
      pulledStates?: string | null; // "0x115";
      // Open Ethereum sync
      warpChunksAmount?: string | null; // "0x1266";
      warpChunksProcessed?: string | null; // "0x115";
    };

// Current versions of parseInt are able to recognize hex numbers
// and automatically use a radix parameter of 16.
function parseHexOrDecimal(hexOrDecimal: string | number): number {
  return parseInt(String(hexOrDecimal));
}

/**
 * Make sure progress is a valid number, otherwise API typechecking will error since
 * a NaN value may be converted to null
 */
function safeProgress(progress: number): number | undefined {
  if (typeof progress !== "number" || isNaN(progress) || !isFinite(progress))
    return undefined;
  else return progress;
}

/**
 * Returns a chain data object for an [ethereum] API
 * @param name = "Geth"
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
export default async function ethereum(
  name: string,
  api: string
): Promise<ChainData> {
  const provider = new ethers.providers.JsonRpcProvider(api);
  const [syncing, blockNumber] = await Promise.all([
    provider.send("eth_syncing", []) as Promise<EthSyncingReturn>,
    provider.getBlockNumber()
  ]);

  return {
    name,
    ...parseEthereumState(syncing, blockNumber)
  };
}

/**
 * Parses is syncing return
 * Isolated in a pure function for testability
 */
export function parseEthereumState(
  syncing: EthSyncingReturn,
  blockNumber: number
): Omit<ChainData, "name"> {
  if (syncing) {
    const currentBlock = parseHexOrDecimal(syncing.currentBlock);
    const highestBlock = parseHexOrDecimal(syncing.highestBlock);

    // Syncing but very close
    if (highestBlock - currentBlock < MIN_BLOCK_DIFF_SYNC)
      return {
        syncing: false,
        error: false,
        message: "Synced #" + blockNumber
      };

    // Geth sync with states
    if (
      (typeof syncing.knownStates === "string" ||
        typeof syncing.knownStates === "number") &&
      (typeof syncing.pulledStates === "string" ||
        typeof syncing.pulledStates === "number")
    ) {
      const currentState = parseHexOrDecimal(syncing.knownStates);
      const highestState = parseHexOrDecimal(syncing.pulledStates);

      return {
        syncing: true,
        error: false,
        // Render multiline status in the UI
        message: [
          `Blocks synced: ${currentBlock} / ${highestBlock}`,
          `States synced: ${currentState} / ${highestState}`,
          `[What does this mean?](${gethSyncHelpUrl})`
        ].join("\n\n")
      };
    }

    // Open Ethereum sync
    if (
      (typeof syncing.warpChunksAmount === "string" ||
        typeof syncing.warpChunksAmount === "number") &&
      (typeof syncing.warpChunksProcessed === "string" ||
        typeof syncing.warpChunksProcessed === "number")
    ) {
      const currentChunk = parseHexOrDecimal(syncing.warpChunksProcessed);
      const highestChunk = parseHexOrDecimal(syncing.warpChunksAmount);

      return {
        syncing: true,
        error: false,
        message: `Syncing snapshot: ${currentChunk} / ${highestChunk}`,
        progress: safeProgress(currentChunk / highestChunk)
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
    return {
      syncing: false,
      error: false,
      message: "Synced #" + blockNumber
    };
  }
}
