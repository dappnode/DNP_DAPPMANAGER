import fs from "fs";
import * as eventBus from "../eventBus";
import params from "../params";
import {
  dockerComposeDown,
  dockerRm,
  dockerStop
} from "../modules/docker/dockerCommands";
import * as getPath from "../utils/getPath";
import shell from "../utils/shell";
import { listPackage } from "../modules/docker/listContainers";

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

  // [NOTE] Not necessary to close the ports since they will just
  // not be renewed in the next interval

  if (fs.existsSync(composePath)) {
    await dockerComposeDown(composePath, {
      volumes: deleteVolumes,
      timeout
    });
  } else {
    // Still try to delete the package if there is not compose
    const containerNames = dnp.containers.map(c => c.containerName);
    await dockerStop(containerNames, { time: timeout });
    await dockerRm(containerNames, { volumes: deleteVolumes });
  }

  // Remove DNP folder and files
  if (fs.existsSync(packageRepoDir)) await shell(`rm -r ${packageRepoDir}`);

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnp.dnpName], removed: true });
}
