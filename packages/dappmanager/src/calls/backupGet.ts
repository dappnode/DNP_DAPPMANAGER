import fs from "fs";
import crypto from "crypto";
import path from "path";
import { logs } from "../logs";
import * as db from "../db";
import params from "../params";
// Modules
import { listPackage } from "../modules/docker/list";
// Utils
import shell from "../utils/shell";
import validateBackupArray from "../utils/validateBackupArray";
import { PackageBackup } from "@dappnode/dappnodesdk";

const tempTransferDir = params.TEMP_TRANSFER_DIR;

/**
 * Does a backup of a DNP and sends it to the client for download.
 */
export async function backupGet({
  dnpName,
  backup
}: {
  dnpName: string;
  backup: PackageBackup[];
}): Promise<string> {
  if (!dnpName) throw Error("Argument dnpName must be defined");
  if (!backup) throw Error("Argument backup must be defined");
  if (!backup.length) throw Error("No backup items specified");

  validateBackupArray(backup);

  const dnp = await listPackage({ dnpName });

  // Intermediate step, the file is in local file system
  const backupDir = path.join(tempTransferDir, `${dnp.dnpName}_backup`);
  await shell(`mkdir -p ${backupDir}`); // Never throws

  // Copy file from container to local file system
  try {
    const successfulBackups = [];
    let lastError: Error | null = null;
    for (const { name, path: fromPath, service } of backup) {
      try {
        const container = dnp.containers.find(
          c => !service || c.serviceName === service
        );
        if (!container)
          throw Error(`No container found for service ${service}`);

        const toPath = path.join(backupDir, name);

        await shell(
          `docker cp ${container.containerName}:${fromPath} ${toPath}`
        );
        successfulBackups.push(name);
      } catch (e) {
        if (e.message.includes("No such container:path"))
          e = Error(`path ${fromPath} does not exist`);
        lastError = e;
        logs.error("Error getting backup", { dnpName, name, fromPath }, e);
      }
    }

    if (!successfulBackups.length && lastError) {
      lastError.message = `Could not backup any item: ${lastError.message}`;
      throw lastError;
    }

    /**
     * Use the -C option to cd in the directory before doing the tar
     * Provide the list of directories / files to include to keep the file structure clean
     *
     * successfulBackups = ["config", "keys", "name"]
     * dirList = "config keys name"
     */
    const backupDirComp = `${backupDir}.tar.xz`;
    const dirListToComp = successfulBackups.join(" ");
    await shell(`tar -czf ${backupDirComp} -C ${backupDir} ${dirListToComp}`);
    await shell(`rm -rf ${backupDir}`);

    const fileId = crypto.randomBytes(32).toString("hex");

    db.fileTransferPath.set(fileId, backupDirComp);

    // DEFER THIS ACTION: Clean intermediate file
    setTimeout(() => {
      fs.unlink(backupDirComp, errFs => {
        if (errFs) logs.error(`Error deleting file: ${errFs.message}`);
      });
    }, 15 * 60 * 1000);

    return fileId;
  } catch (e) {
    // In case of error delete all intermediate files to keep the disk space clean
    await shell(`rm -rf ${tempTransferDir}`);
    throw e;
  }
}
