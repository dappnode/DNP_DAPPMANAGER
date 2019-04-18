"use strict"; // 'datauri' requested to use 'use strict';
const params = require("params");
const path = require("path");
// Modules
const docker = require("modules/docker");
const dockerList = require("modules/dockerList");
// Utils
const shell = require("utils/shell");
const randomToken = require("utils/randomToken");
const fileToDataUri = require("utils/fileToDataUri");
const fs = require("fs");
// const { stripTrailingSlash } = require("utils/strings");

const tempDir = `${params.DNCORE_DIR}/.temp-transfer/`;

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

  /**
   * Intermediate step, the file is in local file system
   *
   * Get the file extension so fileToDataUri can find the correct mime type
   * path.extname("config.json") -> `".json"`
   * path.extname("config")      -> `""`
   * path.extname("app/")        -> `""`
   */
  await shell(`mkdir -p ${tempDir}`); // Never throws
  const extension = path.extname(fromPath);
  let toPath = `${tempDir}/${await randomToken()}${extension}`;

  // Copy file from container to local file system
  await docker.copyFileFrom(containerName, fromPath, toPath);

  // /**
  //  * Allow directories by automatically compressing them to .tar.gz files
  //  * 1. Test if directory
  //  * 2. Compress (use stripTrailingSlash to clean path, just in case)
  //  * 3. Clean original files and rename toPath variable
  //  */
  // if (fs.lstatSync(toPath).isDirectory()) {
  //   const toPathCompressed = `${stripTrailingSlash(toPath)}.tar.gz`;
  //   await shell(`tar -czf ${toPathCompressed} ${toPath}`);
  //   await shell(`rm -rf ${toPath}`);
  //   toPath = toPathCompressed;
  // }

  /**
   * Do NOT allow directories for now
   */
  if (fs.lstatSync(toPath).isDirectory()) {
    await shell(`rm -rf ${toPath}`);
    throw Error(
      `path ${fromPath} is a directory. Only single files are allowed`
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

module.exports = copyFileFrom;
