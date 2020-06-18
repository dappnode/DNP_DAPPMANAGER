import { dockerDf, dockerVolumesList } from "../modules/docker/dockerApi";
import { listContainers } from "../modules/docker/listContainers";
import { detectMountpoints } from "../modules/hostScripts";
import { parseDevicePath } from "../modules/compose";
import { VolumeData } from "../types";

/**
 * Returns volume data
 */
export async function volumesGet(): Promise<VolumeData[]> {
  const volumes = await dockerVolumesList();
  const { Volumes: volumesDf } = await dockerDf();
  const dnpList = await listContainers();

  // This expensive function won't be called on empty volDevicePaths
  const shouldDetectMountpoints = volumes.some(vol => vol.Options?.device);
  const mountpoints = shouldDetectMountpoints ? await detectMountpoints() : [];

  // TODO: Calling getHostVolumeSizes() is deactivated until UX is sorted out
  //       calling du on massive dirs can take +30min (i.e. Storj data));
  // const hostVolumeSizes = mapValues(
  //   await getHostVolumeSizes(volDevicePaths),
  //   volSize => parseInt(volSize)
  // );

  // Append sizes after to optimize the number of calls to dockerDf and host
  const formatedVolumes = volumes.map(
    (vol): VolumeData => {
      const pathParts = vol.Options
        ? parseDevicePath(vol.Options.device)
        : undefined;

      const { shortName, owner } = parseVolumeLabels(vol.Labels || {});
      // Get the exact name of the volume owner if any
      const containerOwner = dnpList.find(dnp =>
        dnp.volumes.find(v => v.name === vol.Name && v.isOwner)
      );
      // For custom bind volumes find if they are used
      const isUsed = dnpList.some(dnp =>
        dnp.volumes.find(v => v.name === vol.Name)
      );
      // Get the size of the volume via docker system df -v
      const volDfData = volumesDf.find(v => v.Name === vol.Name);
      const size = volDfData ? volDfData.UsageData.Size : undefined;
      const refCount = volDfData ? volDfData.UsageData.RefCount : undefined;
      const isOrphan = !refCount && !isUsed;

      const volumeData: VolumeData = {
        // Real volume and owner name to call delete on
        name: vol.Name,
        owner: containerOwner ? containerOwner.name : undefined,
        // Guessed volume and owner name for display
        nameDisplay: shortName,
        ownerDisplay: owner,
        createdAt: new Date(vol.CreatedAt).getTime(),
        mountpoint: pathParts ? pathParts.mountpoint : "",
        fileSystem: pathParts
          ? mountpoints.find(fs => fs.mountpoint === pathParts.mountpoint)
          : undefined,
        size,
        refCount,
        isOrphan
      };
      return volumeData;
    }
  );

  return formatedVolumes;
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
