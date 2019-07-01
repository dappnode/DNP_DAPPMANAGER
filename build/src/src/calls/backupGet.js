"use strict"; // 'datauri' requested to use 'use strict';
const params = require("params");
const path = require("path");
const logs = require("logs.js")(module);
const db = require("db");
const fs = require("fs");
const crypto = require("crypto");
// Modules
const dockerList = require("modules/dockerList");
// Utils
const shell = require("utils/shell");
const validateBackupArray = require("utils/validateBackupArray");

const maxSizeKb = 10e3;
const tempTransferDir = params.TEMP_TRANSFER_DIR;

/**
 * Does a backup of a DNP and sends it to the client for download.
 *
 * @param {string} id DNP .eth name
 * @param {array} backup [
 *   { name: "config", path: "/usr/.raiden/config" },
 *   { name: "keystore", path: "/usr/.raiden/secret/keystore" }
 * ]
 * @returns {string} dataUri = "data:application/zip;base64,UEsDBBQAAAg..."
 */
const backupGet = async ({ id, backup }) => {
  if (!id) throw Error("Argument id must be defined");
  if (!backup) throw Error("Argument backup must be defined");
  if (!backup.length) throw Error("No backup items specified");

  validateBackupArray(backup);

  // Get container name
  const dnpList = await dockerList.listContainers();
  const dnp = dnpList.find(p => p.name === id);
  if (!dnp) throw Error(`No DNP found for id ${id}`);
  const containerName = dnp.packageName;

  // Intermediate step, the file is in local file system
  const backupDir = path.join(tempTransferDir, `${dnp.name}_backup`);
  await shell(`mkdir -p ${backupDir}`); // Never throws

  // Copy file from container to local file system
  try {
    const successfulBackups = [];
    let lastError;
    for (const { name, path: fromPath } of backup) {
      try {
        const toPath = path.join(backupDir, name);
        await shell(`docker cp ${containerName}:${fromPath} ${toPath}`);
        successfulBackups.push(name);
      } catch (e) {
        if (e.message.includes("No such container:path"))
          lastError = Error(`path ${fromPath} does not exist`);
        else lastError = e;
        logs.error(
          `Error backing up ${id} - ${name} from ${fromPath}: ${
            lastError.stack
          }`
        );
      }
    }

    if (!successfulBackups.length)
      throw Error(`Could not backup any item: ${lastError.stack}`);

    /**
     * Limit max file size until a DAppNode <-> client transport method is adopted
     * $ du -s -k app/file.gz
     * 12 app/file.gz
     */
    const dirSizeKb = await getFileOrDirSize(backupDir);
    if (dirSizeKb > 200e3) {
      await shell(`rm -rf ${backupDir}`);
      throw Error(
        `Dir file transfers > ${maxSizeKb} KB are not allowed. Attempting ${dirSizeKb} KB`
      );
    }
    // Use node.js util to get the file / dir name safely
    const backupDirCompressed = `${backupDir}.zip`;
    /**
     * To preserve the folder's relative structure while calling zip from a different dir
     * Ref: https://unix.stackexchange.com/a/77616
     * `(cd test/npm-test && zip -r - .) > npm-test.zip`
     */
    await shell(`(cd ${backupDir} && zip -r - .) > ${backupDirCompressed}`);
    await shell(`rm -rf ${backupDir}`);

    /**
     * Limit max file size until a DAppNode <-> client transport method is adopted
     * $ du -s -k app/file.gz
     * 12 app/file.gz
     */
    const fileSizeKb = await getFileOrDirSize(backupDirCompressed);
    if (fileSizeKb > 20e3) {
      await shell(`rm -rf ${backupDirCompressed}`);
      throw Error(
        `File transfers > ${maxSizeKb} KB are not allowed. Attempting ${fileSizeKb} KB`
      );
    }

    const fileId = crypto.randomBytes(32).toString("hex");

    await db.set(fileId, backupDirCompressed);

    // DEFER THIS ACTION: Clean intermediate file
    setTimeout(() => {
      fs.unlink(backupDirCompressed, errFs => {
        logs.error(`Error deleting file: ${errFs.message}`);
      });
    }, 15 * 60 * 1000);

    return {
      message: `Backup ${id}, items: ${successfulBackups.join(", ")}`,
      logMessage: true,
      userAction: true,
      result: fileId
    };
  } catch (e) {
    // In case of error delete all intermediate files to keep the disk space clean
    await shell(`rm -rf ${tempTransferDir}`);
    throw e;
  }
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

module.exports = backupGet;
