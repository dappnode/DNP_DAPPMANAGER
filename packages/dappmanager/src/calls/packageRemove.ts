import fs from "fs";
import * as eventBus from "../eventBus";
import params from "../params";
// Modules
import { dockerComposeDown, dockerRm } from "../modules/docker/dockerCommands";
// Utils
import * as getPath from "../utils/getPath";
import shell from "../utils/shell";
import { listContainer } from "../modules/docker/listContainers";
import { restartPackageVolumes } from "../modules/docker/restartPackageVolumes";
import { logs } from "../logs";

/**
 * Remove package data: docker down + disk files
 *
 * @param {string} id DNP .eth name
 * @param {bool} deleteVolumes flag to also clear permanent package data
 */
export async function packageRemove({
  id,
  deleteVolumes = false,
  timeout = 10
}: {
  id: string;
  deleteVolumes?: boolean;
  timeout?: number;
}): Promise<void> {
  if (!id) throw Error("kwarg id must be defined");

  const { name, isCore, packageName: containerName } = await listContainer(id);

  if (isCore || id === params.dappmanagerDnpName) {
    throw Error("Core packages cannot be cannot be removed");
  }

  // Only no-cores will
  const composePath = getPath.dockerCompose(name, false);
  const packageRepoDir = getPath.packageRepoDir(id, false);

  // Necessary for eventBus dependants to know the exact list of deleted DNPs
  let removedIds: string[] = [id];

  /**
   * [NOTE] Not necessary to close the ports since they will just
   * not be renewed in the next interval
   */

  // Call restartPackageVolumes to safely delete dependant volumes
  if (deleteVolumes) {
    const { removedDnps } = await restartPackageVolumes({
      id,
      doNotRestart: true
    });
    removedIds = removedDnps; // restartPackageVolumes may remove additional DNPs
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
        logs.error(`Error on dockerComposeDown of ${id}`, e);
        await dockerRm(containerName, { volumes: deleteVolumes });
      }
    else await dockerRm(containerName, { volumes: deleteVolumes });
  }

  // Remove DNP folder and files
  if (fs.existsSync(packageRepoDir)) await shell(`rm -r ${packageRepoDir}`);

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ ids: removedIds, removed: true });
}
