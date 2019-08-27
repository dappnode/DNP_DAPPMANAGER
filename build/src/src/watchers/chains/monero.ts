const Daemon = require("monero-rpc").Daemon;
import { ChainDataInterface } from "../../types";
import { promisify } from "util";

// Monero's average block time is 2 minutes

const MIN_BLOCK_DIFF_SYNC = 15;

/**
 * Returns a chain data object for an [monero] API
 * @param {string} name = "Monero"
 * @param {string} api = "http://my.monero.dnp.dappnode.eth:18081"
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
export default async function monero(
  name: string,
  api: string
): Promise<ChainDataInterface> {
  try {
    const daemon = new Daemon(api);
    const info = await promisify(daemon.getInfo)();

    const highestBlock = info.target_height;
    const currentBlock = info.height;
    if (highestBlock - currentBlock > MIN_BLOCK_DIFF_SYNC) {
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
        message: `Synced #${currentBlock}`
      };
    }
  } catch (e) {
    return {
      name,
      syncing: false,
      error: true,
      message: e.message
    };
  }
}
