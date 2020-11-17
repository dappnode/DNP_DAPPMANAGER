import fs from "fs";
import { listPackage } from "../modules/docker/listContainers";
import { dockerComposeUp, dockerRm } from "../modules/docker/dockerCommands";
import { removeNamedVolume } from "../modules/docker/removeNamedVolume";
import { getContainersAndVolumesToRemove } from "../modules/docker/restartPackageVolumes";
import * as eventBus from "../eventBus";
import * as getPath from "../utils/getPath";
import params from "../params";
import { logs } from "../logs";

/**
 * Removes a package volumes. The re-ups the package
 */
export async function packageRestartVolumes({
  dnpName,
  volumeId: volumeName
}: {
  dnpName: string;
  /**
   * volumeId = "gethdnpdappnodeeth_geth"
   */
  volumeId?: string;
}): Promise<void> {
  if (!dnpName) throw Error("kwarg dnpName must be defined");

  // Needs the extended info that includes the volume ownership data
  // Fetching all containers to not re-fetch below
  const dnp = await listPackage({ dnpName });
  if (dnp.dnpName === params.dappmanagerDnpName)
    throw Error("The dappmanager cannot be restarted");

  // Make sure the compose exists before deleting it's containers
  const composePath = getPath.dockerCompose(dnp.dnpName, dnp.isCore);
  if (!fs.existsSync(composePath))
    throw Error(`No compose found for ${dnp.dnpName}: ${composePath}`);

  const {
    volumesToRemove,
    containersToRemove
  } = getContainersAndVolumesToRemove(dnp, volumeName);
  logs.debug({ dnpName, volumesToRemove, containersToRemove });

  // Skip early to prevent calling dockerComposeUp
  if (volumesToRemove.length === 0) {
    return;
  }

  let err: Error | null = null;
  try {
    if (containersToRemove.length > 0) await dockerRm(containersToRemove);
    for (const volName of volumesToRemove) await removeNamedVolume(volName);
  } catch (e) {
    err = e;
  }

  // In case of error: FIRST up the dnp, THEN throw the error
  await dockerComposeUp(composePath);
  if (err) throw err;

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnpName] });
}
