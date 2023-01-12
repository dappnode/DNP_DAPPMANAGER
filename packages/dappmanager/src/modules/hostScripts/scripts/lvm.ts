import memoize from "memoizee";
import { runScript } from "../runScripts";
import {
  HostHardDisk,
  HostHardDisksReport,
  HostVolumeGroup,
  HostVolumeGroupReport,
  HostLogicalVolume,
  HostLogicalVolumeReport
} from "@dappnode/common";

/**
 * Returns host hard disks detected
 */
export const getHostHardDisks = memoize(
  async function (): Promise<HostHardDisk[]> {
    const hardDisksInfo = await runScript("lvm.sh", "-- --get-disks");
    const hardDisksReport: HostHardDisksReport = JSON.parse(hardDisksInfo);
    return hardDisksReport.blockdevices;
  },
  { promise: true, maxAge: 2000 }
);

/**
 * Returns host volume groups
 */
export const getHostVolumeGroups = memoize(
  async function (): Promise<HostVolumeGroup[]> {
    const volumeGroupsInfo = await runScript("lvm.sh", "-- --get-vg");
    const volumeGroupReport: HostVolumeGroupReport =
      JSON.parse(volumeGroupsInfo);
    const volumeGroups = volumeGroupReport.report[0].vg;
    return volumeGroups;
  },

  { promise: true, maxAge: 2000 }
);

/**
 * Returns host logical volumes
 */
export const getHostLogicalVolumes = memoize(
  async function (): Promise<HostLogicalVolume[]> {
    const logicalVolumeInfo = await runScript("lvm.sh", "-- --get-lv");
    const logicalVolumeReport: HostLogicalVolumeReport =
      JSON.parse(logicalVolumeInfo);
    const logicalVolumes = logicalVolumeReport.report[0].lv;
    return logicalVolumes;
  },
  { promise: true, maxAge: 2000 }
);

/**
 * Extends host disk space
 */
export const extendHostDiskSpace = memoize(
  async function (
    disk: string,
    volumeGroup: string,
    logicalVolume: string
  ): Promise<string> {
    return await runScript(
      "lvm.sh",
      `-- --extend ${disk} ${volumeGroup} ${logicalVolume}`
    );
  },
  { promise: true, maxAge: 2000 }
);
