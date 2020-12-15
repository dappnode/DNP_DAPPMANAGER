import fs from "fs";
import { uniq } from "lodash";
import { listPackage } from "../modules/docker/list";
import {
  dockerComposeUp,
  dockerRm,
  dockerStop
} from "../modules/docker/dockerCommands";
import { removeNamedVolume } from "../modules/docker/removeNamedVolume";
import * as eventBus from "../eventBus";
import * as getPath from "../utils/getPath";
import params from "../params";
import { logs } from "../logs";
import { DockerVolumeListItem, dockerVolumesList } from "../modules/docker/api";
import { isVolumeOwner } from "../modules/docker/volumesData";
import { InstalledPackageData } from "../types";
import { getDockerTimeoutMax } from "../modules/docker/utils";

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
  const volumes = await dockerVolumesList();
  const dnp = await listPackage({ dnpName });
  const timeout = getDockerTimeoutMax(dnp.containers);

  if (dnp.dnpName === params.dappmanagerDnpName)
    throw Error("The dappmanager cannot be restarted");

  // Make sure the compose exists before deleting it's containers
  const composePath = getPath.dockerCompose(dnp.dnpName, dnp.isCore);
  if (!fs.existsSync(composePath))
    throw Error(`No compose found for ${dnp.dnpName}: ${composePath}`);

  const {
    volumesToRemove,
    containersToRemove
  } = getContainersAndVolumesToRemove(dnp, volumeName, volumes);
  logs.debug({ dnpName, volumesToRemove, containersToRemove });

  // Skip early to prevent calling dockerComposeUp
  if (volumesToRemove.length === 0) {
    return;
  }

  let err: Error | null = null;
  try {
    if (containersToRemove.length > 0) {
      await dockerStop(containersToRemove, { time: timeout });
      await dockerRm(containersToRemove);
    }
    for (const volName of volumesToRemove) {
      await removeNamedVolume(volName);
    }
  } catch (e) {
    err = e;
  }

  // In case of error: FIRST up the dnp, THEN throw the error
  await dockerComposeUp(composePath, { timeout });
  if (err) throw err;

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnpName] });
}

/**
 * Util: Remove all package volumes => compute list of packages and volumes to remove
 */
export function getContainersAndVolumesToRemove(
  dnp: InstalledPackageData,
  volumeName: string | undefined,
  volumes: DockerVolumeListItem[]
): {
  containersToRemove: string[];
  volumesToRemove: string[];
} {
  // All volumes
  const volumesToRemove: string[] = [];
  const containersToRemove: string[] = [];

  for (const container of dnp.containers) {
    for (const vol of container.volumes) {
      // Pick only named volumes
      // Pick either the selected `volumeName` or all volumes
      if (vol.name && (!volumeName || volumeName === vol.name)) {
        const volData = volumes.find(v => v.Name === vol.name);
        // Pick only own volumes (same compose project) unless isCore or noData
        if (dnp.isCore || !volData || isVolumeOwner(dnp, volData)) {
          // TODO: Make sure only to add volumes that are NOT external
          volumesToRemove.push(vol.name);
          containersToRemove.push(container.containerName);
        }
      }
    }
  }

  return {
    containersToRemove: uniq(containersToRemove),
    volumesToRemove: uniq(volumesToRemove)
  };
}
