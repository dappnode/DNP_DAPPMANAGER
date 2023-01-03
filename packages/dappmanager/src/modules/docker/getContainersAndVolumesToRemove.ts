import { uniq } from "lodash-es";
import { InstalledPackageData } from "@dappnode/common";
import { isVolumeOwner } from "../docker/volumesData";
import { DockerVolumeListItem } from "./api";

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
