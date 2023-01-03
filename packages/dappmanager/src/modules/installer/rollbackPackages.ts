import fs from "fs";
import params from "../../params";
import { Log } from "../../utils/logUi";
import { InstallPackageDataPaths } from "@dappnode/common";
import { logs } from "../../logs";
import { isNotFoundError } from "../../utils/node";
import { dockerComposeRm, dockerComposeUpPackage } from "../docker";

/**
 * [Rollback] Stop all new packages with the new compose
 * Up the old packages with the previous compose
 * @param packagesData
 * @param log
 */
export async function rollbackPackages(
  packagesData: InstallPackageDataPaths[],
  log: Log
): Promise<void> {
  // Restore all backup composes. Do it first to make sure the next version compose is not
  // used unintentionally if the installed package is restored
  for (const pkg of packagesData)
    for (const { from, to } of [
      { from: pkg.composeBackupPath, to: pkg.composePath },
      { from: pkg.manifestBackupPath, to: pkg.manifestPath }
    ])
      try {
        // Don't use rename as it fails if paths are in different file systems (docker volume / docker container)
        fs.copyFileSync(from, to);
        fs.unlinkSync(from);
      } catch (e) {
        if (!isNotFoundError(e) || pkg.isUpdate)
          logs.error(`Rollback error restoring ${pkg.dnpName} ${from}`, e);
      }

  // Delete image files
  for (const pkg of packagesData)
    try {
      fs.unlinkSync(pkg.imagePath);
    } catch (e) {
      logs.error(`Rollback error removing ${pkg.dnpName} image`, e);
    }

  // Restore backup versions
  for (const pkg of packagesData)
    try {
      log(pkg.dnpName, "Aborting and rolling back...");

      if (pkg.dnpName === params.dappmanagerDnpName) {
        // The DAPPMANAGER cannot be rolled back here. If the restartPatch has already
        // stopped the original container this line will never be reached. If the
        // restartPatch failed before stopping the original container there's no need
        // to roll back, since the current container has the original version.
      } else if (pkg.isUpdate) {
        await dockerComposeUpPackage(
          { dnpName: pkg.dnpName, composePath: pkg.composePath },
          pkg.containersStatus,
          { timeout: pkg.dockerTimeout }
        );
      } else {
        // Remove new containers that were NOT installed before this install call
        await dockerComposeRm(pkg.composePath);
      }

      log(pkg.dnpName, "Aborted and rolled back...");
    } catch (e) {
      logs.error(`Rollback error rolling starting ${pkg.dnpName}`, e);
    }
}
