const path = require("path");
// Modules
const docker = require("modules/docker");
// Utils
const fileToDataUri = require("utils/fileToDataUri");

const maxSizeBytes = 20e6;

/**
 * Copy file from a DNP and downloaded on the client
 *
 * @param {string} id DNP .eth name
 * @param {string} fromPath path to copy file from
 * - If path = path to a file: "/usr/src/app/config.json".
 *   Downloads and sends that file
 * - If path = path to a directory: "/usr/src/app".
 *   Downloads all directory contents, tar them and send as a .tar.gz
 * - If path = relative path: "config.json".
 *   Path becomes $WORKDIR/config.json, then downloads and sends that file
 *   Same for relative paths to directories.
 * @returns {string} dataUri = "data:application/zip;base64,UEsDBBQAAAg..."
 */
const copyFileFrom = async ({ id, fromPath }) => {
  if (!id) throw Error("Argument id must be defined");
  if (!fromPath) throw Error("Argument fromPath must be defined");

  /**
   * Copy file from container to local file system
   * copyFileFrom will return
   * - if it's a directory:     a .zip file
   * - if it's not a directory: the raw file if
   */
  const content = await docker.copyFileFrom(id, { pathContainer: fromPath });

  /**
   * Allow directories by automatically compressing them to .tar.gz files
   * 1. Test if directory
   * 2. Compress (use stripTrailingSlash to clean path, just in case)
   * 3. Clean original files and rename toPath variable
   */

  /**
   * Limit max file size until a better DAppNode <-> client transport method is adopted
   */
  if (content.length > maxSizeBytes) {
    throw Error(
      `File transfers > ${maxSizeBytes} KB are not allowed. Attempting ${
        content.length
      } bytes`
    );
  }

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
  const dataUri = await fileToDataUri(content, path.parse(fromPath).ext);

  return {
    message: `Copied file from: ${id} path: ${fromPath}`,
    logMessage: true,
    userAction: true,
    result: dataUri
  };
};

module.exports = copyFileFrom;
