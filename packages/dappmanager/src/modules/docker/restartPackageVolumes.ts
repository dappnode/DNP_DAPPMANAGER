import { uniq } from "lodash";
import { InstalledPackageData } from "../../types";

/**
 * ```
 * dnpsToRemove = [
 *   "letsencrypt-nginx.dnp.dappnode.eth",
 *   "nginx-proxy.dnp.dappnode.eth"
 * ]
 * ```
 */
type ContainersToRemove = string[];
/**
 * volumesToRemove = [
 *   "nginxproxydnpdappnodeeth_html",
 *   "1f6ceacbdb011451622aa4a5904309765dc2bfb0f4affe163f4e22cba4f7725b",
 *   "nginxproxydnpdappnodeeth_vhost.d"
 * ]
 * ```
 */
type VolumesToRemove = string[];

export async function assertNoExternalVolumeUsers() {}

/**
 * Util: Remove all package volumes => compute list of packages and volumes to remove
 */
export function getContainersAndVolumesToRemove(
  dnp: InstalledPackageData,
  volumeName?: string
): {
  containersToRemove: ContainersToRemove;
  volumesToRemove: VolumesToRemove;
} {
  // All volumes
  const volumesToRemove: VolumesToRemove = [];
  const containersToRemove: ContainersToRemove = [];

  for (const container of dnp.containers)
    for (const vol of container.volumes) {
      if (vol.name && (!volumeName || volumeName === vol.name)) {
        // TODO: Make sure only to add volumes that are NOT external
        volumesToRemove.push(vol.name);
        containersToRemove.push(container.containerName);
      }
    }

  return {
    containersToRemove: uniq(containersToRemove),
    volumesToRemove: uniq(volumesToRemove)
  };
}
