import { getVolumeSystemData } from "../modules/docker/volumesData";
import { VolumeData } from "@dappnode/common";

/**
 * Returns volume data
 */
export async function volumesGet(): Promise<VolumeData[]> {
  return getVolumeSystemData();
}
