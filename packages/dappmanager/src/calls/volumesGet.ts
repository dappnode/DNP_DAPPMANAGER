import { dockerDf, dockerVolumesList } from "../modules/docker/dockerApi";
import { listContainers } from "../modules/docker/listContainers";
import { parseDevicePath } from "../modules/compose";
import { VolumeData } from "../types";

/**
 * Normalizes a docker-compose project name 
 * ```python
 * def normalize_name(name):
    return re.sub(r'[^-_a-z0-9]', '', name.lower())
 * ```
 * https://github.com/docker/compose/blob/854c14a5bcf566792ee8a972325c37590521656b/compose/cli/command.py#L178
 */
export const normalizeProjectName = (name: string): string =>
  name.replace(/[^-_a-z0-9]/gi, "").toLowerCase();

/**
 * Returns volume data
 */
export async function volumesGet(): Promise<VolumeData[]> {
  const volumes = await dockerVolumesList();
  const { Volumes: volumesDf } = await dockerDf();
  const dnpList = await listContainers();

  // This expensive function won't be called on empty volDevicePaths

  // TODO: Calling getHostVolumeSizes() is deactivated until UX is sorted out
  //       calling du on massive dirs can take +30min (i.e. Storj data));
  // const hostVolumeSizes = mapValues(
  //   await getHostVolumeSizes(volDevicePaths),
  //   volSize => parseInt(volSize)
  // );

  // Append sizes after to optimize the number of calls to dockerDf and host
  const formatedVolumes = volumes.map(
    (vol): VolumeData => {
      // Get user names
      const users = Array.from(
        dnpList.reduce((_users, dnp) => {
          if (dnp.volumes.some(v => v.name === vol.Name)) _users.add(dnp.name);
          return _users;
        }, new Set<string>())
      );

      // Get the volume owner
      // TODO: Weak, derived from project name, may be exploited
      const labels = vol.Labels || {};
      const { normalizedOwnerName, internalName } = parseVolumeLabels(labels);
      const ownerContainer = dnpList.find(dnp => {
        normalizeProjectName(dnp.name) === normalizedOwnerName;
      });
      // Fallback, assign ownership to the first user
      const owner = ownerContainer ? ownerContainer.name : users[0];

      // Get the size of the volume via docker system df -v
      const volDfData = volumesDf.find(v => v.Name === vol.Name);
      const size = volDfData ? volDfData.UsageData.Size : undefined;
      const refCount = volDfData ? volDfData.UsageData.RefCount : undefined;
      const isOrphan = !refCount && users.length === 0; // Check users for custom bind volumes

      // Custom mountpoint data
      const pathParts = vol.Options
        ? parseDevicePath(vol.Options.device)
        : undefined;

      return {
        // Real volume and owner name to call delete on
        name: vol.Name,
        owner,
        users,
        internalName,
        createdAt: new Date(vol.CreatedAt).getTime(),
        mountpoint: pathParts ? pathParts.mountpoint : "",
        size,
        refCount,
        isOrphan
      };
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
}): { normalizedOwnerName: string; internalName?: string } {
  const project = (labels || {})["com.docker.compose.project"];
  const volume = (labels || {})["com.docker.compose.volume"];
  // Core: ".project": "dncore",
  //        ".volume": "binddnpdappnodeeth_data"
  // Dnp:  ".project": "lightning-networkdnpdappnodeeth",
  //        ".volume": "lndconfig_backup"
  if (project === "dncore") {
    const [normalizedOwnerName, internalName] = volume.split("_");
    return { normalizedOwnerName, internalName: internalName || volume };
  } else {
    return { normalizedOwnerName: project, internalName: volume };
  }
}
