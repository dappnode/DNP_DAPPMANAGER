const params = require("params");
const path = require("path");
const fs = require("fs");
const logs = require("logs.js")(module);
// Modules
const dockerList = require("modules/dockerList");
// Utils
const shell = require("utils/shell");
const dataUriToFile = require("utils/dataUriToFile");
const validateBackupArray = require("utils/validateBackupArray");

const tempTransferDir = params.TEMP_TRANSFER_DIR;

/**
 * Restore a previous backup of a DNP, from the dataUri provided by the user
 *
 * @param {string} id DNP .eth name
 * @param {string} dataUri = "data:application/zip;base64,UEsDBBQAAAg..."
 * @param {array} backup [
 *   { name: "config", path: "/usr/.raiden/config" },
 *   { name: "keystore", path: "/usr/.raiden/secret/keystore" }
 * ]
 */
const backupRestore = async ({ id, dataUri, backup }) => {
  if (!id) throw Error("Argument id must be defined");
  if (!dataUri) throw Error("Argument dataUri must be defined");
  if (!backup) throw Error("Argument backup must be defined");
  if (!backup.length) throw Error("No backup items specified");

  validateBackupArray(backup);

  // Get container name
  const dnpList = await dockerList.listContainers();
  const dnp = dnpList.find(p => p.name === id);
  if (!dnp) throw Error(`No DNP found for id ${id}`);
  const containerName = dnp.packageName;

  // Intermediate step, the file is in local file system
  await shell(`mkdir -p ${tempTransferDir}`); // Never throws
  const backupDir = path.join(tempTransferDir, `${dnp.name}_backup`);
  const backupDirCompressed = `${backupDir}.zip`;
  await shell(`rm -rf ${backupDir}`); // Just to be sure it's clean
  await shell(`rm -rf ${backupDirCompressed}`); // Just to be sure it's clean

  try {
    /**
     * Convert dataUri to local file
     *
     * In this conversion direction MIME types don't matter
     * The extension is what decides the type and it's the user's
     * responsability to specify it correctly on the UI. The code will
     * not cause problems if the types are not setup corretly
     */
    dataUriToFile(dataUri, backupDirCompressed);
    /**
     * Unzip to directory. The destination directory will be created by unzip
     * `unzip transfers/raiden_backup.zip -d transfers`
     */
    await shell(`unzip ${backupDirCompressed} -d ${backupDir}`);

    const successfulBackups = [];
    let lastError;
    for (const { name, path: toPath } of backup) {
      try {
        const fromPath = path.join(backupDir, name);
        // lstatSync throws if path does not exist, so must call existsSync first
        if (!fs.existsSync(fromPath))
          throw Error(`path ${fromPath} does not exist`);

        // Make sure the base dir exists on the container (will throw otherwise)
        const toPathDir = path.parse(toPath).dir;
        await shell(`docker exec ${containerName} mkdir -p ${toPathDir}`);

        if (fs.lstatSync(fromPath).isDirectory()) {
          await shell(`docker cp ${fromPath}/. ${containerName}:${toPath}`);
        } else {
          await shell(`docker cp ${fromPath} ${containerName}:${toPath}`);
        }
        successfulBackups.push(name);
      } catch (e) {
        lastError = e;
        logs.error(`Backup error ${id} - ${name} from ${toPath}: ${e.stack}`);
      }
    }

    if (!successfulBackups.length)
      throw Error(`Could not unbackup any item: ${lastError.stack}`);

    // Clean intermediate file
    await shell(`rm -rf ${backupDir}`);
    await shell(`rm -rf ${backupDirCompressed}`);

    return {
      message: `Restored backup ${id}, items: ${successfulBackups.join(", ")}`,
      logMessage: true,
      userAction: true
    };
  } catch (e) {
    // In case of error delete all intermediate files to keep the disk space clean
    await shell(`rm -rf ${tempTransferDir}`);
    throw e;
  }
};

module.exports = backupRestore;
