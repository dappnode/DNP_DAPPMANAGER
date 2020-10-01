import fs from "fs";
import * as eventBus from "../eventBus";
import params from "../params";
// Modules
import { dockerComposeDown, dockerRm } from "../modules/docker/dockerCommands";
// Utils
import * as getPath from "../utils/getPath";
import shell from "../utils/shell";
import { listPackage } from "../modules/docker/listContainers";
import { restartPackageVolumes } from "../modules/docker/restartPackageVolumes";
import { logs } from "../logs";

/**
 * Remove package data: docker down + disk files
 *
 * @param id DNP .eth name
 * @param deleteVolumes flag to also clear permanent package data
 */
export async function packageRemove({
  dnpName,
  deleteVolumes = false,
  timeout = 10
}: {
  dnpName: string;
  deleteVolumes?: boolean;
  timeout?: number;
}): Promise<void> {
  if (!dnpName) throw Error("kwarg dnpName must be defined");

  const dnp = await listPackage({ dnpName });

  if (dnp.isCore || dnp.dnpName === params.dappmanagerDnpName) {
    throw Error("Core packages cannot be cannot be removed");
  }

  // Only no-cores will
  const composePath = getPath.dockerCompose(dnp.dnpName, false);
  const packageRepoDir = getPath.packageRepoDir(dnp.dnpName, false);

  // Necessary for eventBus dependants to know the exact list of deleted DNPs
  let removedDnps: string[] = [dnp.dnpName];

  /**
   * [NOTE] Not necessary to close the ports since they will just
   * not be renewed in the next interval
   */

  // Call restartPackageVolumes to safely delete dependant volumes
  if (deleteVolumes) {
    // Note: restartPackageVolumes may remove additional DNPs
    removedDnps = (
      await restartPackageVolumes({
        dnpName: dnp.dnpName,
        doNotRestart: true
      })
    ).removedDnps;
  } else {
    /**
     * If there is no docker-compose, do a docker rm directly
     * Otherwise, try to do a docker-compose down and if it fails,
     * log to console and do docker-rm
     */
    if (fs.existsSync(composePath))
      try {
        await dockerComposeDown(composePath, {
          volumes: deleteVolumes,
          timeout
        });
      } catch (e) {
        logs.error(`Error on dockerComposeDown of ${dnp.dnpName}`, e);
        for (const container of dnp.containers)
          await dockerRm(container.containerName, { volumes: deleteVolumes });
      }
    else {
      for (const container of dnp.containers)
        await dockerRm(container.containerName, { volumes: deleteVolumes });
    }
  }

  // Remove DNP folder and files
  if (fs.existsSync(packageRepoDir)) await shell(`rm -r ${packageRepoDir}`);

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: removedDnps, removed: true });
}
