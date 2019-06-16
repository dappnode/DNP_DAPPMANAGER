"use strict"; // 'datauri' requested to use 'use strict';
const Datauri = require("datauri");

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
async function fileToDataUri(content, extension = ".") {
  const datauri = new Datauri();
  datauri.format(extension, content);
  let dataUriString = datauri.content;

  /**
   * the npm package "datauri" is not able to process .tar.gz correctly,
   * Correct it to the correct MIME type: "application/gzip"
   */
  if (extension === ".tar.gz")
    dataUriString = dataUriString.replace(
      "application/octet-stream",
      "application/gzip"
    );

  return dataUriString;
}

module.exports = fileToDataUri;
