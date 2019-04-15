const getDataUri = require("datauri").promise;

/**
 * Converts a file to data URI.
 * Path must have an extension for the mime type to be processed properly
 *
 * @param {object} path file path
 * @returns {string} data URI: data:application/zip;base64,UEsDBBQAAAg...
 */
async function fileToDataUri(path) {
  return await getDataUri(path);
}

module.exports = fileToDataUri;
