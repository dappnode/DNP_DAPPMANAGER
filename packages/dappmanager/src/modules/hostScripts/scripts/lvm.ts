import memoize from "memoizee";
import { runScript } from "../runScripts";
import { HostVolumeGroup, HostLogicalVolume } from "../../../types";

/**
 * Returns host hard disks detected
 */
export const getHostHardDisks = memoize(
  async function (): Promise<string[]> {
    const hardDisks = await runScript("lvm.sh", "-- --get-disks");
    return hardDisks.trim().split(" ");
  },
  { promise: true, maxAge: 2000 }
);

/**
 * Returns host volume groups
 */
export const getHostVolumeGroups = memoize(
  async function (): Promise<string[]> {
    const volumeGroupsInfo = await runScript("lvm.sh", "-- --get-vg");
    const volumeGroups: HostVolumeGroup = JSON.parse(volumeGroupsInfo);
    return volumeGroups.report[0].vg.map(item => item.vg_name);
  },

  { promise: true, maxAge: 2000 }
);

/**
 * Returns host logical volumes
 */
export const getHostLogicalVolumes = memoize(
  async function (): Promise<string[]> {
    const logicalVolumeInfo = await runScript("lvm.sh", "-- --get-lv");
    const logicalVolumes: HostLogicalVolume = JSON.parse(logicalVolumeInfo);
    return logicalVolumes.report[0].lv.map(item => item.vg_name);
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
