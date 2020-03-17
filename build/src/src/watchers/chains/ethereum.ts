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
      knownStates?: string; // "0x1266";
      pulledStates?: string; // "0x115";
      // Open Ethereum sync
      warpChunksAmount?: string; // "0x1266";
      warpChunksProcessed?: string; // "0x115";
    };

// Current versions of parseInt are able to recognize hex numbers
// and automatically use a radix parameter of 16.
function parseHexOrDecimal(hexOrDecimal: string): number {
  return parseInt(hexOrDecimal);
}

/**
 * Returns a chain data object for an [ethereum] API
 * @param {string} name = "Geth"
 * @param {string} api = "http://geth.dappnode:8545"
 * @returns {object}
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

  if (syncing) {
    const currentBlock = parseHexOrDecimal(syncing.currentBlock);
    const highestBlock = parseHexOrDecimal(syncing.highestBlock);

    // Syncing but very close
    if (highestBlock - currentBlock > MIN_BLOCK_DIFF_SYNC)
      return {
        name,
        syncing: false,
        error: false,
        message: "Synced #" + blockNumber
      };

    // Geth sync with states
    if (
      typeof syncing.knownStates !== "undefined" &&
      typeof syncing.pulledStates !== "undefined"
    ) {
      const currentState = parseHexOrDecimal(syncing.knownStates);
      const highestState = parseHexOrDecimal(syncing.pulledStates);

      return {
        name,
        syncing: true,
        error: false,
        // Render multiline status in the UI
        message: [
          `Blocks synced: ${currentBlock} / ${highestBlock}`,
          `States synced: ${currentState} / ${highestState}`,
          `[What does this mean?](${gethSyncHelpUrl})`
        ].join("\n\n"),
        progress: currentState / highestState
      };
    }

    // Open Ethereum sync
    if (
      typeof syncing.warpChunksAmount !== "undefined" &&
      typeof syncing.warpChunksProcessed !== "undefined"
    ) {
      const currentChunk = parseHexOrDecimal(syncing.warpChunksProcessed);
      const highestChunk = parseHexOrDecimal(syncing.warpChunksAmount);

      return {
        name,
        syncing: true,
        error: false,
        message: `Syncing snapshot: ${currentChunk} ${highestChunk}`,
        progress: currentChunk / highestChunk
      };
    }

    // Return normal only blocks sync info
    return {
      name,
      syncing: true,
      error: false,
      message: `Blocks synced: ${currentBlock} / ${highestBlock}`,
      progress: currentBlock / highestBlock
    };
  } else {
    return {
      name,
      syncing: false,
      error: false,
      message: "Synced #" + blockNumber
    };
  }
}
