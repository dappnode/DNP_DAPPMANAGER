import {
  dockerUpdate,
  dockerVersionGet,
  hostInfoGet
} from "../modules/hostScripts";
import {
  DockerScriptOptionHostInfo,
  DockerScriptOptionUpdate,
  DockerScriptOptionVersion,
  HostInfoScript
} from "../types";

/**
 * Updates docker engine/docker-compose.
 * OPTIONS:
 * engine
 *    -i | --install : installs docker engine using "package method". If error returns string error
 * compose
 *    -i | --install : installs docker compose. If error returns string error
 */
export async function updateDocker({
  updateOption
}: {
  updateOption: DockerScriptOptionUpdate;
}): Promise<string> {
  try {
    return await dockerUpdate(updateOption);
  } catch (e) {
    throw Error(`Error: ${e.stdout}`);
  }
}

/**
 * Returns docker engine/docker-compose versions.
 * OPTIONS:
 * engine
 *    -v | --version : returns string with docker-server version
 * compose
 *    -v | --version : returns string with docker compose version
 */
export async function getDockerVersion({
  versionOption
}: {
  versionOption: DockerScriptOptionVersion;
}): Promise<string> {
  try {
    return await dockerVersionGet(versionOption);
  } catch (e) {
    throw Error(`Error: ${e.stdout}`);
  }
}

/**
 * Returns host info in JSON format.
 * OPTIONS:
 * system: returns system info in JSON format: OS, architecture, OS version and docker versions (compose and engine)
 */
export async function getHostInfo({
  option
}: {
  option: DockerScriptOptionHostInfo;
}): Promise<HostInfoScript> {
  try {
    return await hostInfoGet(option);
  } catch (e) {
    throw Error(`Error: ${e.stdout}`);
  }
}
