const getDataUri = require("datauri").promise;

/**
 * Converts a file to data URI.
 * Path must have an extension for the mime type to be processed properly.
 * If there is no extension, the MIME type will be:
 * - application/octet-stream, which is defined as "arbitrary binary data"
 * When the browser receives that MIME type it means:
 * - "I don't know what the hell this is. Please save it as a file"
 *
 * [NOTE] does not support directories, it will throw an error:
 *   Error: EISDIR: illegal operation on a directory, read
 *
 * @param {object} path file path, will read the file at this path
 * @returns {string} data URI: data:application/zip;base64,UEsDBBQAAAg...
 */
async function fileToDataUri(path) {
  let dataUri = await getDataUri(path);

  /**
   * the npm package "datauri" is not able to process .tar.gz correctly,
   * Correct it to the correct MIME type: "application/gzip"
   */
  if (path.endsWith(".tar.gz"))
    dataUri = dataUri.replace("application/octet-stream", "application/gzip");

  return dataUri;
}

module.exports = fileToDataUri;
