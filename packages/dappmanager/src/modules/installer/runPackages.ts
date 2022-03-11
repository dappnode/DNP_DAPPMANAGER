import path from "path";
import params from "../../params";
import { dockerComposeUp } from "../docker/compose";
import { restartDappmanagerPatch } from "./restartPatch";
import { Log } from "../../utils/logUi";
import { copyFileTo } from "../../calls/copyFileTo";
import { InstallPackageData } from "../../types";
import { logs } from "../../logs";
import { dockerComposeUpPackage } from "../docker";
import { packageToInstallHasPid } from "../../utils/pid";
import { exposeByDefaultHttpsPorts } from "./exposeByDefaultHttpsPorts";
import { ComposeFileEditor } from "../compose/editor";

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

      continue;
      // This line should never be reached, because restartDappmanagerPatch() should
      // either throw, or never resolve because the main process is killed by docker
    }

    // Create the new containers first starting to
    // - Allow copying files without duplicating logic
    // - Allow conditionally starting containers latter if were previously running
    log(pkg.dnpName, "Preparing package...");


    // Recreate HTTPs portal mapping if installing or updating HTTPs package
    if (pkg.dnpName === params.HTTPS_PORTAL_DNPNAME) {
      // Check whether DNP_HTTPS compose has external network persisted
      const compose = new ComposeFileEditor(pkg.dnpName, true);
      if(compose.getComposeNetwork(params.DNP_EXTERNAL_NETWORK_NAME) === null) {
        log(pkg.dnpName, "Adding external network to HTTPS compose...");
        const composeService = compose.services()["https.dnp.dappnode.eth"];
        composeService.addNetwork(params.DNP_EXTERNAL_NETWORK_NAME);
        compose.write();
      }
    }

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

    // containersStatus captures the container status before updating
    // If previous container was exited with code === 0, do not start it
    await dockerComposeUpPackage(
      { dnpName: pkg.dnpName, composePath: pkg.composePath },
      pkg.containersStatus
    );

    log(pkg.dnpName, "Package started");

    // Expose default HTTPs ports if required
    await exposeByDefaultHttpsPorts(pkg, log);
  }
}
