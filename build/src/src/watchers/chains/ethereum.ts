// #### NOTE: Typedefinitions of web3.eth.isSyncing() are not correct, using require to ignore them
const Web3 = require("web3"); // #### NOTE
import { ChainData } from "../../types";

const MIN_BLOCK_DIFF_SYNC = 60;

// Utils
function parseSyncing(current: string, total: string): string {
  return `${parseHexOrDecimal(current)} / ${parseHexOrDecimal(total)}`;
}

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
  const web3 = new Web3(api);
  const [syncing, blockNumber] = await Promise.all([
    web3.eth.isSyncing(),
    web3.eth.getBlockNumber()
  ]);
  if (
    syncing &&
    syncing.highestBlock - syncing.currentBlock > MIN_BLOCK_DIFF_SYNC
  ) {
    if (syncing.warpChunksAmount > 0 && syncing.warpChunksProcessed > 0) {
      return {
        name,
        syncing: true,
        error: false,
        message: `Syncing snapshot: ${parseSyncing(
          syncing.warpChunksProcessed,
          syncing.warpChunksAmount
        )}`,
        progress: syncing.warpChunksProcessed / syncing.warpChunksAmount
      };
    } else {
      return {
        name,
        syncing: true,
        error: false,
        message: `Blocks synced: ${parseSyncing(
          syncing.currentBlock,
          syncing.highestBlock
        )}`,
        progress: syncing.currentBlock / syncing.highestBlock
      };
    }
  } else {
    return {
      name,
      syncing: false,
      error: false,
      message: "Synced #" + blockNumber
    };
  }
}
