import fs from "fs";
import crypto from "crypto";
import path from "path";
import { logs } from "@dappnode/logger";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
// Modules
import { dockerGetBackupItem, listPackage, writeBackupArchive } from "@dappnode/dockerapi";
// Utils
import { shell } from "@dappnode/utils";
import { validateBackupArray } from "../utils/index.js";
import { PackageBackup } from "@dappnode/types";
import { canStopForBackup, stopPackageForBackup } from "../fullBackup/packageStop.js";
import { isValidatorPackage } from "../fullBackup/coverage.js";

const tempTransferDir = params.TEMP_TRANSFER_DIR;

/**
 * Does a backup of a DNP and sends it to the client for download.
 */
export async function backupGet({ dnpName, backup }: { dnpName: string; backup: PackageBackup[] }): Promise<string> {
  if (!dnpName) throw Error("Argument dnpName must be defined");
  if (!backup) throw Error("Argument backup must be defined");
  if (!backup.length) throw Error("No backup items specified");

  validateBackupArray(backup);

  const dnp = await listPackage({ dnpName });

  // Intermediate step, the file is in local file system
  const backupDir = path.join(tempTransferDir, `${dnp.dnpName}_backup`);
  const backupDirComp = `${backupDir}.tar.xz`;
  await shell(`mkdir -p ${backupDir}`); // Never throws

  // Copy file from container to local file system
  try {
    const successfulBackups: string[] = [];
    let lastError: Error | null = null;
    // Stop validators while copying so they cannot sign between the last
    // write of their slashing protection and the copy
    const validator = isValidatorPackage({ dnpName, backup });
    const restart = validator && canStopForBackup(dnp) ? await stopPackageForBackup(dnp) : null;
    try {
      for (const { name, path: fromPath, service } of backup) {
        try {
          const container = dnp.containers.find((c) => !service || c.serviceName === service);
          if (!container) throw Error(`No container found for service ${service}`);

          const toPath = path.join(backupDir, `${name}.tar`);

          // The docker archive API keeps the owner and permissions of the files
          await dockerGetBackupItem(container.containerName, fromPath, toPath);
          successfulBackups.push(name);
        } catch (e) {
          // Docker also answers 404 "No such container" if the container does not exist
          const pathNotFound = e.statusCode === 404 && e.message.includes("Could not find the file");
          lastError = pathNotFound ? Error(`path ${fromPath} does not exist`) : e;
          logs.error("Error getting backup", { dnpName, name, fromPath }, e);
        }
      }
    } finally {
      if (restart) await restart();
    }

    if (!successfulBackups.length && lastError) {
      lastError.message = `Could not backup any item: ${lastError.message}`;
      throw lastError;
    }

    /**
     * Gzip tar (despite the extension) with one top level entry per item, the
     * same layout `tar -czf` produced from `docker cp` copies:
     *
     * successfulBackups = ["config", "keys"]
     * config, keys/, keys/key1.json
     */
    await writeBackupArchive(
      successfulBackups.map((name) => ({ name, tarPath: path.join(backupDir, `${name}.tar`) })),
      backupDirComp
    );
    await shell(`rm -rf ${backupDir}`);

    const fileId = crypto.randomBytes(32).toString("hex");

    db.fileTransferPath.set(fileId, backupDirComp);

    // DEFER THIS ACTION: Clean intermediate file
    setTimeout(() => {
      fs.unlink(backupDirComp, (errFs) => {
        if (errFs) logs.error(`Error deleting file: ${errFs.message}`);
      });
    }, 15 * 60 * 1000);

    return fileId;
  } catch (e) {
    // In case of error delete the intermediate files of this backup to keep the disk space clean
    await shell(`rm -rf ${backupDir} ${backupDirComp}`);
    throw e;
  }
}
