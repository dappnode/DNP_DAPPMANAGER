import memoize from "memoizee";
import { HostInfoScript } from "../../../types";
import { runScript } from "../runScripts";

/**
 * Collects host info
 */
export const getHostInfoMemoized = memoize(
  async function(): Promise<HostInfoScript> {
    const hostInfo = await runScript("collect_host_info.sh");
    const info: HostInfoScript = JSON.parse(hostInfo);
    return {
      dockerComposeVersion: info.dockerComposeVersion,
      dockerServerVersion: info.dockerServerVersion,
      dockerCliVersion: info.dockerCliVersion,
      os: info.os.toLowerCase().trim(),
      versionCodename: info.versionCodename.toLowerCase().trim(),
      architecture: info.architecture.toLowerCase().trim(),
      kernel: info.kernel.toLowerCase().trim()
    };
  },

  { promise: true }
);
