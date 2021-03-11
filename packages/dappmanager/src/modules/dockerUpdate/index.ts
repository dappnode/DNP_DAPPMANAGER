import {
  DockerComposeUpdateRequirement,
  DockerEngineUpdateRequirement,
  HostInfoScript
} from "../../common";
import {
  getDockerComposeVersion,
  getDockerEnginehostInfo,
  updateDockerCompose,
  updateDockerEngine
} from "../hostScripts";
import { params } from "./params";
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
  DockerEngineUpdateRequirement[]
> {
  try {
    const hostInfoRequirements: HostInfoScript = await getDockerEnginehostInfo();
    return [
      {
        title: "OS",
        isFulFilled: getIsOs(hostInfoRequirements.os),
        message: `Your OS is: ${
          hostInfoRequirements.os
        }. OS allowed: ${params.VERSION_CODENAME.join(",")}`
      },
      {
        title: "Version",
        isFulFilled: getIsOsVersion(hostInfoRequirements.versionCodename),
        message: `Your version is: ${
          hostInfoRequirements.versionCodename
        }. Versions allowed: ${params.VERSION_CODENAME.join(",")}`
      },
      {
        title: "Architecture",
        isFulFilled: getIsArchitecture(hostInfoRequirements.architecture),
        message: `Your architecture is: ${
          hostInfoRequirements.architecture
        }. Architectures allowed: ${params.ARCHITECTURE.join(",")}`
      },
      {
        title: "Upgrade",
        isFulFilled: getIsDockerEngineUpgrade(
          hostInfoRequirements.versionCodename,
          hostInfoRequirements.dockerServerVersion
        ),
        message: `Your current docker engine version is ${hostInfoRequirements.dockerServerVersion}`
      },
      {
        title: "Synchronization",
        isFulFilled: getIsDockerSynchronized(
          hostInfoRequirements.dockerServerVersion,
          hostInfoRequirements.dockerCliVersion
        ),
        message: `Docker server version: ${hostInfoRequirements.dockerServerVersion}. Docker cli version ${hostInfoRequirements.dockerCliVersion}`
      },
      {
        title: "Compatibility",
        isFulFilled: getIsDockerEngineUpdateCompatible(
          hostInfoRequirements.dockerComposeVersion
        ),
        message: `Docker engine version: ${hostInfoRequirements.dockerServerVersion}. Docker compose version: ${hostInfoRequirements.dockerComposeVersion}`
      }
    ];
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
  DockerComposeUpdateRequirement[]
> {
  try {
    const dockerVersions = await getDockerComposeVersion();
    return [
      {
        title: "Upgrade",
        isFulFilled: getIsDockerComposeUpgrade(
          dockerVersions.dockerComposeVersion
        ),
        message: `Your current docker compose version is ${dockerVersions.dockerComposeVersion}`
      },
      {
        title: "Compatibility",
        isFulFilled: getIsDockerComposeUpdateCompatible(
          dockerVersions.dockerServerVersion
        ),
        message: `Docker engine version: ${dockerVersions.dockerServerVersion}. Docker compose version: ${dockerVersions.dockerComposeVersion}`
      }
    ];
  } catch (e) {
    throw Error(`Error: ${e.stdout}`);
  }
}
