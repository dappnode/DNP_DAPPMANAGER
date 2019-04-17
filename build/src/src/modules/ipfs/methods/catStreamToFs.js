const fs = require("fs");
const { isAbsolute } = require("path");
const ipfs = require("../ipfsSetup");
const params = require("params");
const logs = require("logs.js")(module);
const { timeoutError } = require("../data");

/**
 * Streams an IPFS object to the local fs.
 * If the stream does not start within the specified timeout,
 * it will throw and error. This utility does not verify the file
 *
 * @param {string} hash "QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ"
 * @param {string} path "/usr/src/path-to-file/file.ext"
 * @param {object} options Available options:
 * - onChunk: {function} Gets called on every received chuck
 *   function(chunk) {}
 */
function catStreamToFs(hash, path, options = {}) {
  return new Promise((resolve, reject) => {
    if (!path || path.startsWith("/ipfs/") || !isAbsolute("/"))
      reject(Error(`Invalid path: "${path}"`));
    if (options && typeof options !== "object")
      reject(Error("options must be an object"));

    // Timeout cancel mechanism
    const timeoutToCancel = setTimeout(() => {
      reject(Error(timeoutError));
    }, params.IPFS_TIMEOUT);

    const onError = streamId => err => {
      clearTimeout(timeoutToCancel);
      reject(Error(streamId + ": " + err));
    };

    const onData = chunk => {
      clearTimeout(timeoutToCancel);
      if (options.onChunk) options.onChunk(chunk);
    };

    const onFinish = data => {
      // Pin files after a successful download
      ipfs.pin.add(hash, err => {
        if (err) logs.error(`Error pinning hash ${hash}: ${err.stack}`);
      });
      resolve(data);
    };

    const readStream = ipfs
      .catReadableStream(hash)
      .on("data", onData)
      .on("error", onError("ReadableStream"));
    const writeStream = fs
      .createWriteStream(path)
      .on("finish", onFinish)
      .on("error", onError("WriteStream"));
    readStream.pipe(writeStream);
  });
}

module.exports = catStreamToFs;
