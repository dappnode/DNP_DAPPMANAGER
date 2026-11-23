import path from "path";
import fs from "fs";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";
import { dockerPutBackupItem, listPackage, readBackupArchive, tarListTopLevelNames } from "@dappnode/dockerapi";
import { packageRestart } from "./packageRestart.js";
import { shell } from "@dappnode/utils";
import { validateBackupArray } from "../utils/index.js";
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
  await shell(`rm -rf ${backupDirCompressed}`); // Just to be sure it's clean

  // Fetch the filePath and the file with fileId
  const filePath = db.fileTransferPath.get(fileId);
  if (!filePath) throw Error(`No file found for id: ${fileId}`);
  if (!fs.existsSync(filePath)) throw Error(`No file found at path: ${filePath}`);
  await shell(`mv ${filePath} ${backupDirCompressed}`);

  try {
    /**
     * The backup is a gzip tar with one top level entry per item
     * `tar -tf vpn.dnp.dappnode.eth_backup.tar.xz`
     * modules/  modules/...  secrets/  src
     */
    const backupNames = await tarListTopLevelNames(readBackupArchive(backupDirCompressed));

    const successfulBackups: string[] = [];
    let lastError: Error | null = null;
    for (const { name, path: toPath, service } of backup) {
      try {
        const container = dnp.containers.find((c) => !service || c.serviceName === service);
        if (!container) throw Error(`No container found for service ${service}`);
        const containerName = container.containerName;

        if (!backupNames.has(name)) throw Error(`${name} not found in the backup file`);

        // The docker archive API keeps the owner and permissions stored in the
        // backup, and needs neither a shell in the container nor it running
        await dockerPutBackupItem(containerName, backupDirCompressed, { name, itemPath: toPath });
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
    await shell(`rm -rf ${backupDirCompressed}`);

    // Restart package so the file changes take effect
    await packageRestart({ dnpName });
  } catch (e) {
    // In case of error delete the intermediate file of this restore to keep the disk space clean
    await shell(`rm -rf ${backupDirCompressed}`);
    throw e;
  }
}
