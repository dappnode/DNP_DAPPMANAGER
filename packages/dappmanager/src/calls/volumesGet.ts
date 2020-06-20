import { getVolumeSystemData } from "../modules/docker/volumesData";
import { VolumeData } from "../types";

/**
 * Returns volume data
 */
export async function volumesGet(): Promise<VolumeData[]> {
  return getVolumeSystemData();
}
