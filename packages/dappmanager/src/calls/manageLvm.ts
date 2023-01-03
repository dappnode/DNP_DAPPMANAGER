import {
  getHostHardDisks,
  getHostVolumeGroups,
  getHostLogicalVolumes,
  extendHostDiskSpace
} from "../modules/hostScripts/scripts/lvm";
import {
  HostHardDisk,
  HostVolumeGroup,
  HostLogicalVolume
} from "@dappnode/common";

export async function lvmhardDisksGet(): Promise<HostHardDisk[]> {
  return await getHostHardDisks();
}

export async function lvmVolumeGroupsGet(): Promise<HostVolumeGroup[]> {
  return await getHostVolumeGroups();
}

export async function lvmLogicalVolumesGet(): Promise<HostLogicalVolume[]> {
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
