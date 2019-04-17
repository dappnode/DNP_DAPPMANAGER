const ipfs = require("../ipfsSetup");
const params = require("params");
const logs = require("logs.js")(module);
const { timeoutError } = require("../data");

/**
 * Returns a file addressed by a valid IPFS Path.
 * @param {string} hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
 * @param {object} options Available options:
 * - maxLength: specifies a length to read from the stream.
 *   if reached, it will throw an error
 * @returns {buffer} hash contents as a buffer
 */
function cat(hash, { maxLength, asBuffer } = {}) {
  return new Promise((resolve, reject) => {
    // Timeout cancel mechanism
    const timeoutToCancel = setTimeout(() => {
      reject(Error(timeoutError));
    }, params.IPFS_TIMEOUT);

    const options = {};
    if (maxLength) options.length = maxLength;

    ipfs.cat(hash, options, (err, data) => {
      clearTimeout(timeoutToCancel);
      if (err) return reject(err);

      if (data.length === maxLength)
        reject(Error(`Maximum size exceeded (${maxLength} bytes)`));

      // Pin files after a successful download
      ipfs.pin.add(hash, err => {
        if (err) logs.error(`Error pinning hash ${hash}: ${err.stack}`);
      });

      if (asBuffer) resolve(data);
      else resolve(data.toString());
    });
  });
}

module.exports = cat;
