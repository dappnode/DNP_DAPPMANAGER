import path from "path";
import fs from "fs";
import * as db from "../db/index.js";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";
import { listPackage } from "../modules/docker/list/index.js";
import { packageRestart } from "./packageRestart.js";
import shell from "../utils/shell.js";
import validateBackupArray from "../utils/validateBackupArray.js";
import { PackageBackup } from "@dappnode/types";

const tempTransferDir = params.TEMP_TRANSFER_DIR;

/**
 * Restore a previous backup of a DNP, from the dataUri provided by the user
 */
export async function backupRestore({
  dnpName,
  backup,
  fileId
}: {
  dnpName: string;
  backup: PackageBackup[];
  fileId: string;
}): Promise<void> {
  if (!dnpName) throw Error("Argument dnpName must be defined");
  if (!fileId) throw Error("Argument fileId must be defined");
  if (!backup) throw Error("Argument backup must be defined");
  if (!backup.length) throw Error("No backup items specified");

  validateBackupArray(backup);

  // Get container name
  const dnp = await listPackage({ dnpName });

  // Intermediate step, the file is in local file system
  const backupDir = path.join(tempTransferDir, `${dnp.dnpName}_backup`);
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
    for (const { name, path: toPath, service } of backup) {
      try {
        const container = dnp.containers.find(
          c => !service || c.serviceName === service
        );
        if (!container)
          throw Error(`No container found for service ${service}`);
        const containerName = container.containerName;

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
        logs.error("Error restoring backup", { dnpName, name, toPath }, e);
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
    await packageRestart({ dnpName });
  } catch (e) {
    // In case of error delete all intermediate files to keep the disk space clean
    await shell(`rm -rf ${tempTransferDir}`);
    throw e;
  }
}
