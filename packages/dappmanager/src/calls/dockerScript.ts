import {
  getDockerEngineUpdateRequirements,
  getDockerComposeUpdateRequirements
} from "../modules/dockerUpdate";
import {
  DockerComposeUpdateRequirement,
  DockerEngineUpdateRequirement
} from "../types";

/**
 * Updates engine and compose
 */
export async function dockerEngineAndComposeUpdate(): Promise<string> {
  const engineUpdate = await dockerEngineUpdate();
  const composeUpdate = await dockerComposeUpdate();
  return engineUpdate + composeUpdate;
}

/**
 * Updates docker engine
 */
export async function dockerEngineUpdate(): Promise<string> {
  return await dockerEngineUpdate();
}

/**
 * Docker engine requirements
 */
export async function dockerEngineUpdateRequirements(): Promise<
  DockerEngineUpdateRequirement[]
> {
  return await getDockerEngineUpdateRequirements();
}

/**
 * Updates docker compose
 */
export async function dockerComposeUpdate(): Promise<string> {
  return await dockerComposeUpdate();
}

/**
 * Docker compose requirements
 */
export async function dockerComposeUpdateRequirements(): Promise<
  DockerComposeUpdateRequirement[]
> {
  return await getDockerComposeUpdateRequirements();
}
