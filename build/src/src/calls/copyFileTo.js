const params = require('params');
const fs = require('fs');
// Modules
const docker = require('modules/docker');
const dockerList = require('modules/dockerList');
// Utils
const randomToken = require('utils/randomToken');
const dataUriToFile = require('utils/dataUriToFile');

/**
 * Copy file to a DNP:
 *
 * @param {Object} kwargs: {
 *   id: package .eth name (string)
 *   dataUri: "data:application/zip;base64,UEsDBBQAAAg..."
 *   toPath: task id (string)
 * }
 * @return {Object} A formated success message.
 * result: {}
 */
const copyFileTo = async ({id, dataUri, toPath}) => {
  if (!id) throw Error('Argument id must be defined');
  if (!dataUri) throw Error('Argument dataUri must be defined');
  if (!toPath) throw Error('Argument toPath must be defined');

  // Get container name
  const dnpList = await dockerList.listContainers();
  const dnp = dnpList.find((p) => p.name === id);
  if (!dnp) throw Error(`No DNP found for id ${id}`);
  const containerName = dnp.packageName;

  // Intermediate step, the file is in local file system
  const fromPath = `${params.DNCORE_DIR}/${await randomToken()}`;

  // Convert dataUri to local file
  dataUriToFile(dataUri, fromPath);
  // Copy file from local file system to container
  await docker.copyFileTo(containerName, fromPath, toPath);
  // Clean intermediate file
  fs.unlinkSync(fromPath);

  return {
    message: `Copied file to ${id} ${toPath}`,
    logMessage: true,
    userAction: true,
  };
};

module.exports = copyFileTo;
