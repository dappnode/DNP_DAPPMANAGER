const ipfs = require("../ipfsSetup");
const params = require("params");
const { timeoutError } = require("../data");

/**
 * Returns a file addressed by a valid IPFS Path.
 * @param {string} hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
 * @returns {number} CumulativeSize of the ipfs object in bytes
 */
function objectSize(hash) {
  return new Promise((resolve, reject) => {
    // Timeout cancel mechanism
    const timeoutToCancel = setTimeout(() => {
      reject(Error(timeoutError));
    }, params.IPFS_TIMEOUT);

    /**
     * stats = {
     *   Hash: 'QmaokAG8ECxpbLp4bqE6A3tBXsATZS7aN8RPd3DsE1haKz',
     *   NumLinks: 19,
     *   BlockSize: 921,
     *   LinksSize: 838,
     *   DataSize: 83,
     *   CumulativeSize: 4873175
     * }
     */
    ipfs.object.stat(hash, (err, stats) => {
      clearTimeout(timeoutToCancel);
      if (err) reject(err);
      else resolve(stats.CumulativeSize);
    });
  });
}

module.exports = objectSize;
