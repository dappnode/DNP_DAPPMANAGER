import {
  DockerComposeUpdateRequirements,
  DockerEngineUpdateRequirements,
  HostInfoScript
} from "../../common";
import {
  getDockerComposeVersion,
  getDockerEnginehostInfo,
  updateDockerCompose,
  updateDockerEngine
} from "../hostScripts";
import {
  getIsOs,
  getIsOsVersion,
  getIsArchitecture,
  getIsDockerEngineUpgrade,
  getIsDockerSynchronized,
  getIsDockerComposeUpgrade,
  getIsDockerEngineUpdateCompatible,
  getIsDockerComposeUpdateCompatible
} from "./utils";

// Docker engine

/**
 * Updates docker engine
 */
export async function dockerEngineUpdate(): Promise<string> {
  try {
    return await updateDockerEngine();
  } catch (e) {
    throw Error(`Error: ${e.stdout}`);
  }
}

/**
 * Returns host info required to update docker engine.
 */
export async function getDockerEngineUpdateRequirements(): Promise<
  DockerEngineUpdateRequirements
> {
  try {
    const hostInfoRequirements: HostInfoScript = await getDockerEnginehostInfo();
    return {
      isOs: getIsOs(hostInfoRequirements.os),
      isOsVersion: getIsOsVersion(hostInfoRequirements.versionCodename),
      isArchitecture: getIsArchitecture(hostInfoRequirements.architecture),
      isDockerEngineUpgrade: getIsDockerEngineUpgrade(
        hostInfoRequirements.versionCodename,
        hostInfoRequirements.dockerServerVersion
      ),
      isDockerSynchronized: getIsDockerSynchronized(
        hostInfoRequirements.dockerServerVersion,
        hostInfoRequirements.dockerCliVersion
      ),
      isDockerEngineUpdateCompatible: getIsDockerEngineUpdateCompatible(
        hostInfoRequirements.dockerComposeVersion
      ),
      hostInfo: hostInfoRequirements
    };
  } catch (e) {
    throw Error(`Error: ${e.stdout}`);
  }
}

// Docker compose

/**
 * Updates docker compose
 */
export async function dockerComposeUpdate(): Promise<string> {
  try {
    return await updateDockerCompose();
  } catch (e) {
    throw Error(`Error: ${e.stdout}`);
  }
}

/**
 * Returns docker-compose version
 */
export async function getDockerComposeUpdateRequirements(): Promise<
  DockerComposeUpdateRequirements
> {
  try {
    const dockerVersions = await getDockerComposeVersion();
    return {
      isDockerComposeUpgrade: getIsDockerComposeUpgrade(
        dockerVersions.dockerComposeVersion
      ),
      IsDockerComposeUpdateCompatible: getIsDockerComposeUpdateCompatible(
        dockerVersions.dockerServerVersion
      ),
      dockerComposeVersion: dockerVersions.dockerComposeVersion
    };
  } catch (e) {
    throw Error(`Error: ${e.stdout}`);
  }
}
