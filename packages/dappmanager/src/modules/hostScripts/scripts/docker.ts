import memoize from "memoizee";
import { runScript } from "../runScripts";
import { DockerVersionsScript, HostInfoScript } from "@dappnode/common";

/**
 * Updates docker compose
 */
export const updateDockerCompose = memoize(
  async function (): Promise<string> {
    return await runScript("docker_compose_update.sh", "-- --install");
  },
  // Prevent running this script more than once
  { promise: true, maxAge: 2000 }
);

/**
 * Returns host info in JSON format.
 * ```json
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
export const getDockerEnginehostInfo = memoize(
  async function (): Promise<HostInfoScript> {
    const hostInfo = await runScript(
      "docker_engine_update.sh",
      "-- --print-host-info"
    );
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
  // Prevent running this script more than once
  { promise: true, maxAge: 2000 }
);

/**
 * Returns docker compose version
 */
export const getDockerComposeVersion = memoize(
  async function (): Promise<DockerVersionsScript> {
    const dockerVersions = await runScript(
      "docker_compose_update.sh",
      "-- --version"
    );
    const info: DockerVersionsScript = JSON.parse(dockerVersions);
    return {
      dockerComposeVersion: info.dockerComposeVersion,
      dockerServerVersion: info.dockerServerVersion
    };
  },
  // Prevent running this script more than once
  { promise: true, maxAge: 2000 }
);
