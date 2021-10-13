import {
  getHostHardDisks,
  getHostVolumeGroups,
  getHostLogicalVolumes,
  extendHostDiskSpace
} from "../modules/hostScripts/scripts/lvm";

export async function lvmhardDisksGet(): Promise<string[]> {
  return await getHostHardDisks();
}

export async function lvmVolumeGroupsGet(): Promise<string[]> {
  return await getHostVolumeGroups();
}

export async function lvmLogicalVolumesGet(): Promise<string[]> {
  return await getHostLogicalVolumes();
}

export async function lvmDiskSpaceExtend({
  disk,
  volumeGroup,
  logicalVolume
}: {
  disk: string;
  volumeGroup: string;
  logicalVolume: string;
}): Promise<string> {
  return await extendHostDiskSpace(disk, volumeGroup, logicalVolume);
}
