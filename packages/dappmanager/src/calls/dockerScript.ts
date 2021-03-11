import {
  scriptUpdateDockerEngine,
  scriptGetDockerEngineUpdateRequirements,
  scriptUpdateDockerCompose,
  scriptGetDockerComposeUpdateRequirements
} from "../modules/dockerUpdate";
import {
  DockerComposeUpdateRequirement,
  DockerEngineUpdateRequirement
} from "../types";

/**
 * Updates docker engine
 */
export async function dockerEngineUpdate(): Promise<string> {
  return await scriptUpdateDockerEngine();
}

/**
 * Docker engine requirements
 */
export async function dockerEngineUpdateRequirements(): Promise<
  DockerEngineUpdateRequirement[]
> {
  return await scriptGetDockerEngineUpdateRequirements();
}

/**
 * Updates docker compose
 */
export async function dockerComposeUpdate(): Promise<string> {
  return await scriptUpdateDockerCompose();
}

/**
 * Docker compose requirements
 */
export async function dockerComposeUpdateRequirements(): Promise<
  DockerComposeUpdateRequirement[]
> {
  return await scriptGetDockerComposeUpdateRequirements();
}
