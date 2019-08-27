import path from "path";
import fs from "fs";
import * as db from "../db";
import params from "../params";
const logs = require("../logs")(module);
// Modules
import listContainers from "../modules/listContainers";
// External call
import restartPackage from "./restartPackage";
// Utils
import shell from "../utils/shell";
import validateBackupArray from "../utils/validateBackupArray";
import { BackupInterface } from "../types";

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
export default async function backupRestore({
  id,
  backup,
  fileId
}: {
  id: string;
  backup: BackupInterface[];
  fileId: string;
}) {
  if (!id) throw Error("Argument id must be defined");
  if (!fileId) throw Error("Argument fileId must be defined");
  if (!backup) throw Error("Argument backup must be defined");
  if (!backup.length) throw Error("No backup items specified");

  validateBackupArray(backup);

  // Get container name
  const dnpList = await listContainers();
  const dnp = dnpList.find(p => p.name === id);
  if (!dnp) throw Error(`No DNP found for id ${id}`);
  const containerName = dnp.packageName;

  // Intermediate step, the file is in local file system
  const backupDir = path.join(tempTransferDir, `${dnp.name}_backup`);
  const backupDirCompressed = `${backupDir}.tar.xz`;
  await shell(`rm -rf ${backupDir}`); // Just to be sure it's clean
  await shell(`rm -rf ${backupDirCompressed}`); // Just to be sure it's clean
  await shell(`mkdir -p ${backupDir}`); // Never throws

  // Fetch the filePath and the file with fileId
  const filePath = await db.get(fileId);
  if (!filePath) throw Error(`No file found for id: ${fileId}`);
  if (!fs.existsSync(filePath))
    throw Error(`No file found at path: ${filePath}`);
  await shell(`mv ${filePath} ${backupDirCompressed}`);

  try {
    /**
     * Untar to directory
     * `tar -xf vpn.dnp.dappnode.eth_backup.tar.xz -C test/`
     * Then,
     * user@dn:~/home$ ls test/
     * modules  secrets  src
     */
    await shell(`tar -xf ${backupDirCompressed} -C ${backupDir}`);
    await shell(`rm -rf ${backupDirCompressed}`);

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

    // Restart package so the file changes take effect
    await restartPackage({ id });

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
}
