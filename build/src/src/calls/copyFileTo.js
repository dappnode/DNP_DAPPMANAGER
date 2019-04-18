const params = require("params");
// Modules
const docker = require("modules/docker");
const dockerList = require("modules/dockerList");
// Utils
const shell = require("utils/shell");
const dataUriToFile = require("utils/dataUriToFile");

const tempDir = `${params.DNCORE_DIR}/.temp-transfer/`;

/**
 * Copy file to a DNP:
 *
 * @param {string} id DNP .eth name
 * @param {string} dataUri = "data:application/zip;base64,UEsDBBQAAAg..."
 * @param {string} filename name of the uploaded file.
 * - MUST NOT be a path: "/app", "app/", "app/file.txt"
 * @param {string} toPath path to copy a file to
 * - If path = path to a file: "/usr/src/app/config.json".
 *   Copies the contents of dataUri to that file, overwritting it if necessary
 * - If path = path to a directory: "/usr/src/app".
 *   Copies the contents of dataUri to ${dir}/${filename}
 * - If path = relative path: "config.json".
 *   Path becomes $WORKDIR/config.json, then copies the contents of dataUri there
 *   Same for relative paths to directories.
 */
const copyFileTo = async ({ id, dataUri, filename, toPath }) => {
  if (!id) throw Error("Argument id must be defined");
  if (!dataUri) throw Error("Argument dataUri must be defined");
  if (!filename) throw Error("Argument filename must be defined");
  if (!toPath) throw Error("Argument toPath must be defined");
  if (filename.includes("/"))
    throw Error(`filename must not be a path: ${filename}`);

  // Get container name
  const dnpList = await dockerList.listContainers();
  const dnp = dnpList.find(p => p.name === id);
  if (!dnp) throw Error(`No DNP found for id ${id}`);
  const containerName = dnp.packageName;

  // Intermediate step, the file is in local file system
  await shell(`mkdir -p ${tempDir}`); // Never throws
  const fromPath = `${tempDir}/${filename}`;
  await shell(`rm -rf ${fromPath}`); // Just to be sure it's clean

  /**
   * Convert dataUri to local file
   *
   * In this conversion direction MIME types don't matter
   * The extension is what decides the type and it's the user's
   * responsability to specify it correctly on the UI. The code will
   * not cause problems if the types are not setup corretly
   */
  dataUriToFile(dataUri, fromPath);

  // Copy file from local file system to container
  await docker.copyFileTo(containerName, fromPath, toPath);

  // Clean intermediate file
  await shell(`rm -rf ${fromPath}`);

  return {
    message: `Copied file ${filename} to ${id} ${toPath}`,
    logMessage: true,
    userAction: true
  };
};

module.exports = copyFileTo;
