const mime = require("mime");

const fallbackMime = "application/octet-stream";

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
 * @param {buffer} content Contents of the file
 * @param {string} extension ".json"
 * @returns {string} data URI: data:application/zip;base64,UEsDBBQAAAg...
 */
async function fileToDataUri(content, _path) {
  // mime.getType returns null if no mime type is found
  const mimeType = parseMimeType(_path);
  const base64String = content.toString("base64");

  return `data:${mimeType};base64,${base64String}`;
}

/**
 * Deals with parsing paths that are directories i.e. "test"
 * which the mime library can misslabel
 */
function parseMimeType(_path) {
  if (!_path || !_path.includes(".")) return fallbackMime;
  /**
   * mime is not able to process .tar.gz correctly,
   * Correct it to the correct MIME type: "application/gzip"
   */
  if (_path.endsWith(".tar.gz")) return "application/gzip";
  return mime.getType(_path) || fallbackMime;
}

module.exports = fileToDataUri;
