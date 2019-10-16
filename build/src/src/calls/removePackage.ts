import fs from "fs";
import * as eventBus from "../eventBus";
// Modules
import { dockerComposeDown } from "../modules/docker/dockerCommands";
// External call
import restartPackageVolumes from "./restartPackageVolumes";
// Utils
import * as getPath from "../utils/getPath";
import shell from "../utils/shell";
import { RpcHandlerReturn } from "../types";

/**
 * Remove package data: docker down + disk files
 *
 * @param {string} id DNP .eth name
 * @param {bool} deleteVolumes flag to also clear permanent package data
 */
export default async function removePackage({
  id,
  deleteVolumes = false
}: {
  id: string;
  deleteVolumes?: boolean;
}): Promise<RpcHandlerReturn> {
  if (!id) throw Error("kwarg id must be defined");

  const packageRepoDir = getPath.packageRepoDir(id, false);
  const dockerComposePath = getPath.dockerComposeSmart(id);
  if (!fs.existsSync(dockerComposePath)) {
    throw Error(`No docker-compose found: ${dockerComposePath}`);
  }

  if (id.includes("dappmanager.dnp.dappnode.eth")) {
    throw Error("The installer cannot be removed");
  }

  /**
   * [NOTE] Not necessary to close the ports since they will just
   * not be renewed in the next interval
   */

  // Call restartPackageVolumes to safely delete dependant volumes
  if (deleteVolumes) await restartPackageVolumes({ id, doNotRestart: true });
  // Remove container (and) volumes
  await dockerComposeDown(dockerComposePath, { volumes: deleteVolumes });
  // Remove DNP folder and files
  await shell(`rm -r ${packageRepoDir}`);

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packageModified.emit({ id, removed: true });

  return {
    message: `Removed package: ${id}`,
    logMessage: true,
    userAction: true
  };
}
