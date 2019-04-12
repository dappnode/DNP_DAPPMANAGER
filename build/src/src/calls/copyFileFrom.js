"use strict"; // 'datauri' requested to use 'use strict';
const params = require("params");
const fs = require("fs");
const path = require("path");
// Modules
const docker = require("modules/docker");
const dockerList = require("modules/dockerList");
// Utils
const randomToken = require("utils/randomToken");
const fileToDataUri = require("utils/fileToDataUri");

/**
 * Copy file from a DNP and downloaded on the client
 *
 * @param {string} id DNP .eth name
 * @param {string} fromPath = "/usr/src/app/config.json"
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

  // Intermediate step, the file is in local file system
  const extension = path.extname(fromPath);
  const toPath = `${params.DNCORE_DIR}/${await randomToken()}${extension}`;

  // Copy file from container to local file system
  await docker.copyFileFrom(containerName, fromPath, toPath);
  // Convert local file to dataUri
  const dataUri = await fileToDataUri(toPath);
  // Clean intermediate file
  fs.unlinkSync(toPath);

  return {
    message: `Copied file from ${id} ${fromPath}`,
    logMessage: true,
    userAction: true,
    result: dataUri
  };
};

module.exports = copyFileFrom;
