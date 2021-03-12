import {
  DockerComposeUpdateRequirement,
  DockerEngineUpdateRequirement,
  DockerVersionsScript,
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
  getIsDockerComposeStable
} from "./utils";

// Docker engine

/**
 * Updates docker engine
 */
export async function scriptUpdateDockerEngine(): Promise<string> {
  try {
    return await updateDockerEngine();
  } catch (e) {
    throw Error(`Error: ${e.stdout}`);
  }
}

/**
 * Returns host info required to update docker engine.
 */
export async function scriptGetDockerEngineUpdateRequirements(): Promise<
  DockerEngineUpdateRequirement[]
> {
  try {
    const hostInfoRequirements: HostInfoScript = await getDockerEnginehostInfo();
    return [
      {
        title: "OS",
        isFulFilled: getIsOs(hostInfoRequirements.os),
        message: `${hostInfoRequirements.os}`,
        errorMessage: `OS allowed: ${params.VERSION_CODENAME.join(", ")}`
      },
      {
        title: "Version",
        isFulFilled: getIsOsVersion(hostInfoRequirements.versionCodename),
        message: `${hostInfoRequirements.versionCodename}`,
        errorMessage: `Versions allowed: ${params.VERSION_CODENAME.join(", ")}`
      },
      {
        title: "Architecture",
        isFulFilled: getIsArchitecture(hostInfoRequirements.architecture),
        message: `${hostInfoRequirements.architecture}`,
        errorMessage: `Architectures allowed: ${params.ARCHITECTURE.join(", ")}`
      },
      {
        title: "Upgrade",
        isFulFilled: getIsDockerEngineUpgrade(
          hostInfoRequirements.versionCodename,
          hostInfoRequirements.dockerServerVersion
        ),
        message: `docker engine version: ${hostInfoRequirements.dockerServerVersion}`,
        errorMessage: `Docker is updated. Downgrade is not allowed`
      },
      {
        title: "Synchronization",
        isFulFilled: getIsDockerSynchronized(
          hostInfoRequirements.dockerServerVersion,
          hostInfoRequirements.dockerCliVersion
        ),
        message: `Docker server version: ${hostInfoRequirements.dockerServerVersion}. Docker cli version ${hostInfoRequirements.dockerCliVersion}`,
        errorMessage: `Both versions must be equal`
      },
      {
        title: "Compatibility",
        isFulFilled: getIsDockerComposeStable(
          hostInfoRequirements.dockerComposeVersion
        ),
        message: `Docker engine version: ${hostInfoRequirements.dockerServerVersion}. Docker compose version: ${hostInfoRequirements.dockerComposeVersion}`,
        errorMessage: `Both versions must be compatible. Please, first update docker compose`
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
export async function scriptUpdateDockerCompose(): Promise<string> {
  try {
    return await updateDockerCompose();
  } catch (e) {
    throw Error(`Error: ${e.stdout}`);
  }
}

/**
 * Returns docker-compose version
 */
export async function scriptGetDockerComposeUpdateRequirements(): Promise<
  DockerComposeUpdateRequirement[]
> {
  try {
    const dockerVersions: DockerVersionsScript = await getDockerComposeVersion();
    return [
      {
        title: "Upgrade",
        isFulFilled: getIsDockerComposeUpgrade(
          dockerVersions.dockerComposeVersion
        ),
        message: `docker compose version: ${dockerVersions.dockerComposeVersion}`,
        errorMessage: `Downgrade not allowed`
      }
    ];
  } catch (e) {
    throw Error(`Error: ${e.stdout}`);
  }
}
