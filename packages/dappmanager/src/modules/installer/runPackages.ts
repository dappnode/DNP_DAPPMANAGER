import path from "path";
import params from "../../params";
import { dockerComposeUpSafe } from "../docker/dockerSafe";
import { restartDappmanagerPatch } from "./restartPatch";
import { Log } from "../../utils/logUi";
import { copyFileTo } from "../../calls/copyFileTo";
import { InstallPackageData } from "../../types";
import { logs } from "../../logs";

/**
 * Create and run each package container in series
 * The order is extremely important and should be guaranteed by `orderInstallPackages`
 */
export async function runPackages(
  packagesData: InstallPackageData[],
  log: Log
): Promise<void> {
  for (const pkg of packagesData) {
    // patch to prevent installer from crashing
    if (pkg.dnpName == params.dappmanagerDnpName) {
      log(pkg.dnpName, "Reseting DAppNode... ");
      await restartDappmanagerPatch({
        composePath: pkg.composePath,
        composeBackupPath: pkg.composeBackupPath,
        restartCommand: pkg.metadata.restartCommand,
        restartLaunchCommand: pkg.metadata.restartLaunchCommand,
        packagesData
      });
      // This line should never be reached, because restartDappmanagerPatch() should
      // either throw, or never resolve because the main process is killed by docker
    } else {
      // Copy fileUploads if any to the container before up-ing
      if (pkg.fileUploads) {
        log(pkg.dnpName, "Copying file uploads...");
        logs.debug(`${pkg.dnpName} fileUploads`, pkg.fileUploads);

        await dockerComposeUpSafe(pkg.composePath, { noStart: true });
        for (const [serviceName, serviceFileUploads] of Object.entries(
          pkg.fileUploads
        ))
          for (const [containerPath, dataUri] of Object.entries(
            serviceFileUploads
          )) {
            const { dir: toPath, base: filename } = path.parse(containerPath);
            const id = getContainerId(pkg.dnpName, serviceName);
            await copyFileTo({ id, dataUri, filename, toPath });
          }
      }

      log(pkg.dnpName, "Starting package... ");
      await dockerComposeUpSafe(pkg.composePath);
    }

    log(pkg.dnpName, "Package started");
  }
}
