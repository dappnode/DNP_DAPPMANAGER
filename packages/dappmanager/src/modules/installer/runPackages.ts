import path from "path";
import params from "../../params";
import { dockerComposeUp } from "../docker/dockerCommands";
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

        await dockerComposeUp(pkg.composePath, {
          noStart: true,
          timeout: pkg.dockerTimeout
        });
        for (const [serviceName, serviceFileUploads] of Object.entries(
          pkg.fileUploads
        ))
          for (const [containerPath, dataUri] of Object.entries(
            serviceFileUploads
          )) {
            const { dir: toPath, base: filename } = path.parse(containerPath);
            const service = pkg.compose.services[serviceName];
            if (!service) throw Error(`No service for ${serviceName}`);
            const containerName = service.container_name;
            await copyFileTo({ containerName, dataUri, filename, toPath });
          }
      }

      log(pkg.dnpName, "Starting package... ");

      await dockerComposeUp(pkg.composePath, {
        noStart: true,
        // To clean-up changing multi-service packages, remove orphans
        // but NOT for core packages, which always have orphans
        removeOrphans: !pkg.isCore,
        timeout: pkg.dockerTimeout
      });

      if (pkg.allServicesRunning) {
        await dockerComposeUp(pkg.composePath);
      } else if (pkg.runningServicesNames.length > 0) {
        await dockerComposeUp(pkg.composePath, {
          serviceNames: pkg.runningServicesNames
        });
      }
    }

    log(pkg.dnpName, "Package started");
  }
}
