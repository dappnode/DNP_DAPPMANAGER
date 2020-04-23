import fs from "fs";
import crypto from "crypto";
import path from "path";
import Logs from "../logs";
const logs = Logs(module);
import * as db from "../db";
import params from "../params";
// Modules
import { listContainer } from "../modules/docker/listContainers";
// Utils
import shell from "../utils/shell";
import validateBackupArray from "../utils/validateBackupArray";
import { PackageBackup } from "../types";

type ReturnData = string;

const tempTransferDir = params.TEMP_TRANSFER_DIR;

/**
 * Does a backup of a DNP and sends it to the client for download.
 *
 * @param {string} id DNP .eth name
 * @param {array} backup [
 *   { name: "config", path: "/usr/.raiden/config" },
 *   { name: "keystore", path: "/usr/.raiden/secret/keystore" }
 * ]
 * @returns {string} fileId = "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc"
 */
export async function backupGet({
  id,
  backup
}: {
  id: string;
  backup: PackageBackup[];
}): Promise<ReturnData> {
  if (!id) throw Error("Argument id must be defined");
  if (!backup) throw Error("Argument backup must be defined");
  if (!backup.length) throw Error("No backup items specified");

  validateBackupArray(backup);

  // Get container name
  const dnp = await listContainer(id);
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
