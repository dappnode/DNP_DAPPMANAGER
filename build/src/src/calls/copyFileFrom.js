"use strict"; // 'datauri' requested to use 'use strict';
const params = require("params");
const path = require("path");
// Modules
const docker = require("modules/docker");
const dockerList = require("modules/dockerList");
// Utils
const shell = require("utils/shell");
const fileToDataUri = require("utils/fileToDataUri");
const fs = require("fs");

const maxSizeKb = 10e3;
const tempTransferDir = params.TEMP_TRANSFER_DIR;

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

  // Get container name
  const dnpList = await dockerList.listContainers();
  const dnp = dnpList.find(p => p.name === id);
  if (!dnp) throw Error(`No DNP found for id ${id}`);
  const containerName = dnp.packageName;

  // Construct relative paths to container
  // Fetch the WORKDIR from a docker inspect
  if (!path.isAbsolute(fromPath)) {
    // workingDir = "/usr/src/app"
    let workingDir = await docker.getContainerWorkingDir(containerName);
    workingDir = (workingDir || "/").replace(/['"]+/g, "");
    fromPath = path.join(workingDir, fromPath);
  }

  /**
   * Intermediate step, the file is in local file system
   *
   * Get the file extension so fileToDataUri can find the correct mime type
   * path.parse("config.json").base -> `"config.json"`
   * path.parse("config").base      -> `"config"`
   * path.parse("app/").base        -> `"app"`
   */
  await shell(`mkdir -p ${tempTransferDir}`); // Never throws
  const { base } = path.parse(fromPath);
  let toPath = path.join(tempTransferDir, base);

  // Copy file from container to local file system
  await docker.copyFileFrom(containerName, fromPath, toPath);

  /**
   * Allow directories by automatically compressing them to .tar.gz files
   * 1. Test if directory
   * 2. Compress (use stripTrailingSlash to clean path, just in case)
   * 3. Clean original files and rename toPath variable
   */

  if (fs.lstatSync(toPath).isDirectory()) {
    /**
     * Limit max file size until a DAppNode <-> client transport method is adopted
     * $ du -s -k app/file.gz
     * 12 app/file.gz
     */
    const dirSizeKb = await getFileOrDirSize(toPath);
    if (dirSizeKb > 200e3) {
      await shell(`rm -rf ${toPath}`);
      throw Error(
        `Dir file transfers > ${maxSizeKb} KB are not allowed. Attempting ${dirSizeKb} KB`
      );
    }
    // Use node.js util to get the file / dir name safely
    const toPathCompressed = `${toPath}.tar.gz`;
    /**
     * Use the -C option to cd in directory before doing the tar
     * `tar -czf not/hello.tar.gz -C not hello`
     */
    await shell(`tar -czf ${toPathCompressed} -C ${tempTransferDir} ${base}`);
    await shell(`rm -rf ${toPath}`);
    toPath = toPathCompressed;
  }

  /**
   * Limit max file size until a DAppNode <-> client transport method is adopted
   * $ du -s -k app/file.gz
   * 12 app/file.gz
   */
  const fileSizeKb = await getFileOrDirSize(toPath);
  if (fileSizeKb > 20e3) {
    await shell(`rm -rf ${toPath}`);
    throw Error(
      `File transfers > ${maxSizeKb} KB are not allowed. Attempting ${fileSizeKb} KB`
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
   * @param {object} path file path, will read the file at this path
   * @returns {string} data URI: data:application/zip;base64,UEsDBBQAAAg...
   */
  const dataUri = await fileToDataUri(toPath);

  // Clean intermediate file
  await shell(`rm -rf ${toPath}`);

  return {
    message: `Copied file from ${id} ${fromPath}`,
    logMessage: true,
    userAction: true,
    result: dataUri
  };
};

// Utility

/**
 * Limit max file size until a DAppNode <-> client transport method is adopted
 * $ du -s -k app/file.gz
 * 12 app/file.gz
 * @param {string} path "app/file.gz"
 * @returns {string} size in KB "12"
 */
async function getFileOrDirSize(path) {
  const output = await shell(`du -s -k ${path}`);
  const sizeString = output
    .trim()
    .replace(/\t/g, " ")
    .split(" ")[0];
  return parseInt(sizeString || "0");
}

module.exports = copyFileFrom;
