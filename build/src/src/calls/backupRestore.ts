import path from "path";
import fs from "fs";
import * as db from "../db";
import params from "../params";
import { logs } from "../logs";

// Modules
import { listContainer } from "../modules/docker/listContainers";
// External call
import { restartPackage } from "./restartPackage";
// Utils
import shell from "../utils/shell";
import validateBackupArray from "../utils/validateBackupArray";
import { PackageBackup } from "../types";

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
export async function backupRestore({
  id,
  backup,
  fileId
}: {
  id: string;
  backup: PackageBackup[];
  fileId: string;
}): Promise<void> {
  if (!id) throw Error("Argument id must be defined");
  if (!fileId) throw Error("Argument fileId must be defined");
  if (!backup) throw Error("Argument backup must be defined");
  if (!backup.length) throw Error("No backup items specified");

  validateBackupArray(backup);

  // Get container name
  const dnp = await listContainer(id);
  const containerName = dnp.packageName;

  // Intermediate step, the file is in local file system
  const backupDir = path.join(tempTransferDir, `${dnp.name}_backup`);
  const backupDirCompressed = `${backupDir}.tar.xz`;
  await shell(`rm -rf ${backupDir}`); // Just to be sure it's clean
  await shell(`rm -rf ${backupDirCompressed}`); // Just to be sure it's clean
  await shell(`mkdir -p ${backupDir}`); // Never throws

  // Fetch the filePath and the file with fileId
  const filePath = db.fileTransferPath.get(fileId);
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
    let lastError: Error | null = null;
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
        logs.error(`Backup error ${id}`, { name, toPath }, e);
      }
    }

    if (!successfulBackups.length && lastError) {
      lastError.message = `Could not unbackup any item: ${lastError.message}`;
      throw lastError;
    }

    // Clean intermediate file
    await shell(`rm -rf ${backupDir}`);
    await shell(`rm -rf ${backupDirCompressed}`);

    // Restart package so the file changes take effect
    await restartPackage({ id });
  } catch (e) {
    // In case of error delete all intermediate files to keep the disk space clean
    await shell(`rm -rf ${tempTransferDir}`);
    throw e;
  }
}
