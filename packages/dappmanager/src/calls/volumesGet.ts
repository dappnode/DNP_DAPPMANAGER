import { getVolumeSystemData } from "@dappnode/dockerapi";
import { VolumeData } from "@dappnode/types";

/**
 * Returns volume data
 */
export async function volumesGet(): Promise<VolumeData[]> {
  return getVolumeSystemData();
}
