import { ReturnData } from "../route-types/mountpointsGet";
import { RpcHandlerReturnWithResult, MountpointData } from "../types";
import { detectMountpoints } from "../modules/hostScripts";
import { runOnlyOneReturnToAll } from "../utils/asyncFlows";

// Prevent running this script more than once
// #### Develop also a cache strategy
// - If the UI just requests this, give it a TTL of few minutes
// - If the user hits "Refresh", send a "force" argument which
//   will clear the cache and force a re-run
const detectMountpointsThrottled = runOnlyOneReturnToAll(detectMountpoints);

/**
 * Returns the list of current mountpoints in the host,
 * by running a pre-written script in the host
 */
export default async function mountpointsGet(): RpcHandlerReturnWithResult<
  ReturnData
> {
  const mountpoints = await detectMountpointsThrottled();
  const hostMountpoint: MountpointData = {
    mountpoint: "",
    use: "", // await fetchFreePercent(), // "87%"
    total: "", // await fetchTotal(), // "500G"
    free: "", // await fetchFree(), // "141G"
    vendor: "",
    model: ""
  };

  return {
    message: `fetched ${mountpoints.length} mountpoints`,
    result: [hostMountpoint, ...mountpoints]
  };
}
