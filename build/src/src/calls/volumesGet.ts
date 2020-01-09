import { ReturnData } from "../route-types/volumesGet";
import { RpcHandlerReturnWithResult, VolumeData } from "../types";
import { dockerDf } from "../modules/docker/dockerApi";
import { listContainers } from "../modules/docker/listContainers";
import { detectMountpoints } from "../modules/hostScripts";
import { parseDevicePath } from "../utils/dockerComposeParsers";


/**
 * Returns not viewed notifications.
 * Use an array as the keys are not known in advance and the array form
 * is okay for RPC transport, as uniqueness is guaranteed
 *
 * @returns {object} notifications object, by notification id
 * notifications = [{
 *   id: "diskSpaceRanOut-stoppedPackages",
 *   type: "danger",
 *   title: "Disk space ran out, stopped packages",
 *   body: "Available disk space is less than a safe ...",
 * }, ... ]
 */
export default async function volumesGet(): RpcHandlerReturnWithResult<
  ReturnData
> {
  const { Volumes } = await dockerDf();
  const dnpList = await listContainers();

  // This expensive function won't be called on empty volDevicePaths
  const callDetectMountpoints = Volumes.some(vol => (vol.Options || {}).device);
  const mountpoints = callDetectMountpoints ? await detectMountpoints() : [];

  // TODO: Calling getHostVolumeSizes() is deactivated until UX is sorted out
  //       calling du on massive dirs can take +30min (i.e. Storj data));
  // const hostVolumeSizes = mapValues(
  //   await getHostVolumeSizes(volDevicePaths),
  //   volSize => parseInt(volSize)
  // );

  // Append sizes after to optimize the number of calls to dockerDf and host
  const formatedVolumes: VolumeData[] = Volumes.map(vol => {
    const pathParts = vol.Options
      ? parseDevicePath(vol.Options.device)
      : undefined;

    const { shortName, owner } = parseVolumeLabels(vol.Labels || {});
    const containerOwner = dnpList.find(dnp =>
      dnp.volumes.find(v => v.name === vol.Name && v.isOwner)
    );

    const volumeData: VolumeData = {
      // Real volume and owner name to call delete on
      name: vol.Name,
      owner: containerOwner ? containerOwner.name : undefined,
      // Guessed volume and owner name for display
      nameDisplay: shortName,
      ownerDisplay: owner,
      createdAt: new Date(vol.CreatedAt).getTime(),
      mountpoint: pathParts ? pathParts.mountpoint : "",
      size: vol.UsageData.Size,
      fileSystem: pathParts
        ? mountpoints.find(fs => fs.mountpoint === pathParts.mountpoint)
        : undefined,
      refCount: vol.UsageData.RefCount,
      isDangling: vol.UsageData.RefCount === 0
    };
    return volumeData;
  });

  return {
    message: `Got ${formatedVolumes.length} volumes`,
    result: formatedVolumes
  };
}

/**
 * [HELPER] Parses the labels figuring out the owner and actual volume name
 * @param labels "Labels": {
 *   "com.docker.compose.project": "lightning-networkdnpdappnodeeth",
 *   "com.docker.compose.version": "1.24.1",
 *   "com.docker.compose.volume": "lndconfig_backup"
 * },
 */
function parseVolumeLabels(labels?: {
  [labelName: string]: string;
}): { shortName: string | undefined; owner: string | undefined } {
  const project = (labels || {})["com.docker.compose.project"];
  const volume = (labels || {})["com.docker.compose.volume"];
  // Core: ".project": "dncore",
  //        ".volume": "binddnpdappnodeeth_data"
  // Dnp:  ".project": "lightning-networkdnpdappnodeeth",
  //        ".volume": "lndconfig_backup"
  if (project === "dncore") {
    const [owner, shortName] = volume.split("_");
    return { shortName, owner };
  } else {
    return { shortName: volume, owner: project };
  }
}
