import { docker } from "./docker.js";
import { VolumeInspectInfo, VolumeListOptions } from "dockerode";

export async function dockerVolumesList(
  options?: VolumeListOptions
): Promise<VolumeInspectInfoCustom[]> {
  const { Volumes } = await docker.listVolumes(options);
  // TODO: remove type assertion when the type is fixed in dockerode
  // github issue: https://github.com/apocas/dockerode/issues/771
  return Volumes as VolumeInspectInfoCustom[];
}

export interface VolumeInspectInfoCustom extends VolumeInspectInfo {
  CreatedAt: string;
}
