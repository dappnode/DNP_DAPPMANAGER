import { ReturnData } from "../route-types/mountpointsGet";
import { RpcHandlerReturnWithResult, MountpointData } from "../types";
import { detectMountpoints } from "../modules/hostScripts";

/**
 * Returns the list of current mountpoints in the host,
 * by running a pre-written script in the host
 */
export default async function mountpointsGet(): RpcHandlerReturnWithResult<
  ReturnData
> {
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

  return {
    message: `fetched ${mountpoints.length} mountpoints`,
    result: [hostMountpoint, ...mountpoints]
  };
}
