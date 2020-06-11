import fs from "fs";
import path from "path";
import * as db from "../../db";
import { InstallPackageDataPaths } from "../../types";
import { Log } from "../../utils/logUi";
import { dockerCleanOldImages } from "../docker/dockerCommands";
import { logs } from "../../logs";

/**
 * [Post install clean] After a successful install, clean backup files
 * and clean old docker images
 * @param packagesData
 * @param log
 */
export async function postInstallClean(
  packagesData: InstallPackageDataPaths[],
  log: Log
): Promise<void> {
  for (const {
    name,
    semVersion,
    imagePath,
    manifestBackupPath,
    composeBackupPath
  } of packagesData) {
    db.addPackageInstalledMetadata(name);

    // [Clean] old files and images
    // IMPORTANT! Do this step AFTER the try/catch otherwise the rollback
    // will not work, as the compose.next.yml is the same as compose.yml
    log(name, "Cleaning files...");
    unlinkIfExists(composeBackupPath);
    unlinkIfExists(manifestBackupPath);
    unlinkIfExists(imagePath);
    unlinkFilesWithExt(path.parse(imagePath).dir, ".tar.xz"); // Previous images

    log(name, "Cleaning previous images...");
    try {
      await dockerCleanOldImages(name, semVersion);
    } catch (e) {
      logs.warn("Error cleaning images", e);
    }
  }
}

/**
 * Util: Remove file but ignore errors if it does not exist
 * @param path
 */
function unlinkIfExists(path: string): void {
  try {
    fs.unlinkSync(path);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}

/**
 * Util: Remove all files in directory with extension `ext`
 * @param dir "/repo/dir"
 * @param ext ".tar.xz"
 */
function unlinkFilesWithExt(dir: string, ext: string): void {
  for (const file of fs.readdirSync(dir))
    if (file.endsWith(ext)) unlinkIfExists(path.join(dir, file));
}
