const Web3 = require("web3");

const MIN_BLOCK_DIFF_SYNC = 60;

/**
 * Returns a chain data object for an [ethereum] API
 * @param {String} name = "Mainnet"
 * @param {String} api = "http://my.ethchain.dnp.dappnode.eth:8545"
 * @returns {Object}
 * - On success: {
 *   syncing: true, {Bool}
 *   message: "Blocks synced: 543000 / 654000", {String}
 *   progress: 0.83027522935,
 * }
 * - On error: {
 *   message: "Could not connect to RPC", {String}
 *   error: true {Bool},
 * }
 */
async function ethereum({ name, api }) {
  const res = { name };
  try {
    const web3 = new Web3(api);
    const [syncing, blockNumber] = await Promise.all([
      web3.eth.isSyncing(),
      web3.eth.getBlockNumber()
    ]);
    if (
      syncing &&
      syncing.highestBlock - syncing.currentBlock > MIN_BLOCK_DIFF_SYNC
    ) {
      res.syncing = true;
      if (syncing.warpChunksAmount > 0 && syncing.warpChunksProcessed > 0) {
        res.message = `Syncing snapshot: ${parseSyncing(
          syncing.warpChunksProcessed,
          syncing.warpChunksAmount
        )}`;
        res.progress = syncing.warpChunksProcessed / syncing.warpChunksAmount;
      } else {
        res.message = `Blocks synced: ${parseSyncing(
          syncing.currentBlock,
          syncing.highestBlock
        )}`;
        res.progress = syncing.currentBlock / syncing.highestBlock;
      }
    } else {
      res.syncing = false;
      res.message = "Synced #" + blockNumber;
    }
  } catch (e) {
    res.message = e.message;
    res.error = true;
  }
  return res;
}

function parseSyncing(current, total) {
  return `${parseHexOrDecimal(current)} / ${parseHexOrDecimal(total)}`;
}

// Current versions of parseInt are able to recognize hex numbers
// and automatically use a radix parameter of 16.
function parseHexOrDecimal(hexOrDecimal) {
  return parseInt(hexOrDecimal);
}

module.exports = ethereum;
