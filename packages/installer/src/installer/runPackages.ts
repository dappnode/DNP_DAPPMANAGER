import path from "path";
import { params } from "@dappnode/params";
import { restartDappmanagerPatch } from "./restartPatch.js";
import { Log } from "@dappnode/logger";
import { InstallPackageData } from "@dappnode/types";
import { logs } from "@dappnode/logger";
import { dockerComposeUpPackage, dockerComposeUp, copyFileToDockerContainer } from "@dappnode/dockerapi";
import { packageToInstallHasPid } from "@dappnode/utils";
import { httpsPortal } from "@dappnode/httpsportal";
import { notifications } from "@dappnode/notifications";

const externalNetworkName = params.DOCKER_EXTERNAL_NETWORK_NAME;

/**
 * Create and run each package container in series
 * The order is extremely important and should be guaranteed by `orderInstallPackages`
 */
export async function runPackages(packagesData: InstallPackageData[], log: Log): Promise<void> {
  for (const pkg of packagesData) {
    // patch to prevent installer from crashing
    if (pkg.dnpName == params.dappmanagerDnpName) {
      log(pkg.dnpName, "Restarting Dappnode... ");
      await restartDappmanagerPatch({
        composePath: pkg.composePath,
        composeBackupPath: pkg.composeBackupPath,
        restartCommand: pkg.manifest.restartCommand,
        restartLaunchCommand: pkg.manifest.restartLaunchCommand,
        packagesData
      });

      continue;
      // This line should never be reached, because restartDappmanagerPatch() should
      // either throw, or never resolve because the main process is killed by docker
    }

    // Create the new containers first starting to
    // - Allow copying files without duplicating logic
    // - Allow conditionally starting containers latter if were previously running
    log(pkg.dnpName, "Preparing package...");
    await dockerComposeUp(pkg.composePath, {
      // To clean-up changing multi-service packages, remove orphans
      // but NOT for core packages, which always have orphans
      removeOrphans: !pkg.isCore,
      // EXCEPTION!: If the compose contains: `pid:service.serviceName`
      // compose must start with: `noStart: false`
      noStart: !packageToInstallHasPid(pkg) ? true : false,
      timeout: pkg.dockerTimeout
    });

    // Copy fileUploads if any to the container before up-ing
    if (pkg.fileUploads) {
      log(pkg.dnpName, "Copying file uploads...");
      logs.debug(`${pkg.dnpName} fileUploads`, pkg.fileUploads);

      for (const [serviceName, serviceFileUploads] of Object.entries(pkg.fileUploads))
        for (const [containerPath, dataUri] of Object.entries(serviceFileUploads)) {
          const { dir: toPath, base: filename } = path.parse(containerPath);
          const service = pkg.compose.services[serviceName];
          if (!service) throw Error(`No service for ${serviceName}`);
          const containerName = service.container_name;
          if (!containerName) throw Error(`No container name for ${serviceName}`);
          await copyFileToDockerContainer({
            containerName,
            dataUri,
            filename,
            toPath
          });
        }
    }

    log(pkg.dnpName, "Starting package... ");

    // containersStatus captures the container status before updating
    // If previous container was exited with code === 0, do not start it
    // DAPPMANAGER patch
    if (pkg.dnpName === params.dappmanagerDnpName) {
      // Note: About restartPatch, combining rm && up doesn't prevent the installer from crashing
      await restartDappmanagerPatch({ composePath: pkg.composePath });
      return;
    } else {
      await dockerComposeUpPackage({
        composeArgs: { dnpName: pkg.dnpName, composePath: pkg.composePath },
        upAll: false,
        containersStatus: pkg.containersStatus
      });
    }

    log(pkg.dnpName, "Package started");

    // Expose default HTTPs ports if required and connected to public network
    await httpsPortal.connectToPublicNetwork(pkg, externalNetworkName);
    await httpsPortal.exposeByDefaultHttpsPorts(pkg, log);

    // Reload gatus endpoints if any
    try {
      const { isInstalled } = await notifications.notificationsPackageStatus();
      if (pkg.manifest.notifications?.endpoints && isInstalled) await notifications.updateEndpointsApi();
    } catch (error) {
      log(pkg.dnpName, `Could not update endpoints for ${pkg.dnpName}: ${error}`);
      logs.error(`Error updating endpoints for ${pkg.dnpName}`, error);
    }
  }
}
