import fs from "fs";
import { uniq } from "lodash";
import { dockerRm } from "../modules/docker/dockerCommands";
import { dockerComposeUpSafe } from "../modules/docker/dockerSafe";
import { listContainers } from "../modules/docker/listContainers";
import { removeNamedVolume } from "./volumeRemove";
import { volumesGet } from "./volumesGet";
import * as eventBus from "../eventBus";
import params from "../params";
// Utils
import * as getPath from "../utils/getPath";
import { logs } from "../logs";
import { VolumeData, PackageContainer } from "../types";

/**
 * Removes a package volumes. The re-ups the package
 */
export async function packageRestartVolumes({
  id,
  volumeId
}: {
  id: string;
  /**
   * volumeId = "gethdnpdappnodeeth_geth"
   */
  volumeId?: string;
}): Promise<void> {
  const { removedVols, removedDnps } = await restartPackageVolumesTask({
    id,
    volumeId
  });

  // If there are no volumes don't do anything
  if (!removedVols.length) return;

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ ids: removedDnps });
}

/**
 * Abstract the task itself to be used by `removePackage`
 */

/**
 * Removes a package volumes. The re-ups the package
 *
 * @param {string} id DNP .eth name
 */
export async function restartPackageVolumesTask({
  id,
  doNotRestart,
  volumeId
}: {
  id: string;
  doNotRestart?: boolean;
  volumeId?: string;
}): Promise<{
  removedDnps: string[];
  removedVols: string[];
}> {
  if (!id) throw Error("kwarg id must be defined");

  // Needs the extended info that includes the volume ownership data
  // Fetching all containers to not re-fetch below
  const dnpList = await listContainers();
  const volumesData = await volumesGet();

  const { dnpsToRemove, volumesToRemove } = getPackagesAndVolumesToRemove({
    id,
    volumeId,
    dnpList,
    volumesData
  });

  // If there are no volumes don't do anything
  if (volumesToRemove.length === 0) return { removedDnps: [], removedVols: [] };

  logs.debug({ dnpsToRemove, volumesToRemove });

  // Verify results
  const composePaths: { [dnpName: string]: string } = {};
  const containerNames: { [dnpName: string]: string } = {};

  /**
   * Load docker-compose paths and verify results
   * - All docker-compose must exist
   * - No DNP can be the "dappmanager.dnp.dappnode.eth"
   */
  for (const dnpName of dnpsToRemove) {
    if (dnpName.includes(params.dappmanagerDnpName))
      throw Error("The dappmanager cannot be restarted");

    const dnpToRemove = dnpList.find(_dnp => _dnp.name === dnpName);
    if (dnpToRemove) {
      const { isCore, packageName: containerName } = dnpToRemove;
      const composePath = getPath.dockerCompose(dnpName, isCore);
      if (!fs.existsSync(composePath) && !doNotRestart)
        throw Error(`No compose found for ${dnpName}: ${composePath}`);

      composePaths[dnpName] = composePath;
      containerNames[dnpName] = containerName;
    }
  }

  let err: Error | null = null;
  try {
    for (const dnpName of dnpsToRemove)
      if (containerNames[dnpName]) await dockerRm(containerNames[dnpName]);

    // `if` necessary for the compiler
    for (const volName of volumesToRemove)
      if (volName) await removeNamedVolume(volName);
  } catch (e) {
    err = e;
  }

  // Restart docker to apply changes
  // Offer a doNotRestart option for the removePackage call
  // NOTE: if a package is dependant on id's volume it cannot be up-ed
  // again since a volume it requires will not be there
  // NOTE: The UI already alerts the user that multiple packages will
  // be uninstalled at once
  if (doNotRestart) {
    logs.warn(`On restartPackageVolumes, doNotRestart = true`);
  } else {
    // It is critical up packages in the correct order,
    // so that the named volumes are created before the users are started
    for (const dnpName of sortDnpsToRemove(dnpsToRemove, id))
      if (composePaths[dnpName])
        await dockerComposeUpSafe(composePaths[dnpName]);
  }

  // In case of error: FIRST up the dnp, THEN throw the error
  if (err) throw err;

  return {
    removedDnps: dnpsToRemove,
    removedVols: volumesToRemove
  };
}

/**
 * Util to compute list of packages and volumes to remove
 * @returns
 * ```
 * dnpsToRemove = [
 *   "letsencrypt-nginx.dnp.dappnode.eth",
 *   "nginx-proxy.dnp.dappnode.eth"
 * ]
 * volumesToRemove = [
 *   "nginxproxydnpdappnodeeth_html",
 *   "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
 *   "nginxproxydnpdappnodeeth_vhost.d"
 * ]
 * ```
 */
function getPackagesAndVolumesToRemove({
  id,
  volumeId,
  dnpList,
  volumesData
}: {
  id: string;
  volumeId?: string;
  dnpList: PackageContainer[];
  volumesData: VolumeData[];
}): {
  dnpsToRemove: string[];
  volumesToRemove: string[];
} {
  if (volumeId) {
    // Only a single volume
    const volumeData = volumesData.find(v => v.name === volumeId);
    if (!volumeData) throw Error(`Volume ${volumeId} not found`);
    if (volumeData.owner && volumeData.owner !== id)
      throw Error(
        `Volume ${volumeId} can only be deleted by its owner ${volumeData.owner}`
      );
    return {
      dnpsToRemove: volumeData.users,
      volumesToRemove: [volumeData.name]
    };
  } else {
    const dnp = dnpList.find(_dnp => _dnp.name === id);
    if (!dnp) throw Error(`No DNP was found for name ${id}`);

    // All volumes
    const dnpsToRemove: string[] = [];
    const volumesToRemove: string[] = [];
    for (const vol of dnp.volumes) {
      if (vol.name) {
        const volumeData = volumesData.find(v => v.name === vol.name);
        if (volumeData && (!volumeData.owner || volumeData.owner === id)) {
          for (const user of volumeData.users) dnpsToRemove.push(user);
          volumesToRemove.push(vol.name);
        }
      }
    }
    return {
      dnpsToRemove: uniq(dnpsToRemove),
      volumesToRemove: uniq(volumesToRemove)
    };
  }
}

/**
 * It is critical up packages in the correct order,
 * so that the named volumes are created before the users are started
 * [NOTE] the next sort function is a simplified solution, where the
 * id will always be the owner of the volumes, and other DNPs, the users.
 */
function sortDnpsToRemove(dnpsToRemove: string[], id: string): string[] {
  return dnpsToRemove.sort((dnpName: string) => (dnpName === id ? -1 : 1));
}
