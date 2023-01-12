import { detectMountpoints } from "../modules/hostScripts";
import { MountpointData } from "@dappnode/common";

/**
 * Returns the list of current mountpoints in the host,
 * by running a pre-written script in the host
 */
export async function mountpointsGet(): Promise<MountpointData[]> {
  const mountpoints = await detectMountpoints();
  const hostMountpoint: MountpointData = {
    mountpoint: "",
    use: "", // await fetchFreePercent(), // "87%"
    used: 0,
    total: 0, // await fetchTotal(), // "500G"
    free: 0, // await fetchFree(), // "141G"
    vendor: "",
    model: ""
  };

  return [hostMountpoint, ...mountpoints];
}
