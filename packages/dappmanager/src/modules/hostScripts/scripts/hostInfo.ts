import memoize from "memoizee";
import { HostInfoScript } from "@dappnode/common";
import { runScript } from "../runScripts";

/**
 * Collects host info
 * Returns host info in JSON format.
 * ```
 * {
 *   "dockerComposeVersion": "1.28.2",
 *   "dockerServerVersion": "20.10.5",
 *   "dockerCliVersion": "20.10.5",
 *   "os": "ubuntu",
 *   "versionCodename": "bionic",
 *   "architecture": "amd64",
 *   "kernel": "5.4.0-66-generic"
 * }
 * ```
 */
export const getHostInfoMemoized = memoize(
  async function (): Promise<HostInfoScript> {
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
