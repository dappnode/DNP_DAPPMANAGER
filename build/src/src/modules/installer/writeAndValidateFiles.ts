import fs from "fs";
import { writeManifest } from "../../utils/manifestFile";
import { Log } from "../../utils/logUi";
import * as validate from "../../utils/validate";
import { InstallPackageData } from "../../types";
import { writeComposeObj } from "../../utils/dockerComposeFile";
import { dockerComposeConfig } from "../docker/dockerCommands";

/**
 * Write the new compose and test it with config
 * `docker-compose config` will ONLY catch syntactic errors,
 * Stuff like port collisions or environment: - "" will NOT be reported
 * Backup the previous compose if exists to .backup.yml
 * @param packagesData
 */
export async function writeAndValidateFiles(
  packagesData: InstallPackageData[],
  log: Log
) {
  for (const {
    name,
    compose,
    composePath,
    composeBackupPath,
    metadata,
    manifestPath,
    manifestBackupPath
  } of packagesData) {
    log(name, "Writing files...");

    // Create the repoDir if necessary
    validate.path(composePath);

    // Backup compose to be able to do a rollback. Only if compose exists
    if (fs.existsSync(composePath))
      fs.copyFileSync(composePath, composeBackupPath);
    writeComposeObj(composePath, compose);
    await dockerComposeConfig(composePath);

    // Backup manifest to be able to do a rollback. Only if manifest exists
    if (fs.existsSync(manifestPath))
      fs.copyFileSync(manifestPath, manifestBackupPath);
    writeManifest(manifestPath, metadata);
  }
}
