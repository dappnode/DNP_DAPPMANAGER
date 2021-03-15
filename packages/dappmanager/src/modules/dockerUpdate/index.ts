import { DockerUpdateStatus } from "../../types";
import {
  getDockerComposeVersion,
  getDockerEnginehostInfo,
  updateDockerCompose as updateDockerComposeScript,
  updateDockerEngine as updateDockerEngineScript
} from "../hostScripts";
import {
  parseDockerComposeRequirements,
  parseDockerEngineRequirements
} from "./utils";

// Docker engine

export async function updateDockerEngine(): Promise<string> {
  return await updateDockerEngineScript().catch(e => {
    e.message = `Error updating docker compose: ${e.message}`;
    throw e;
  });
}

/**
 * Returns host info required to update docker engine.
 */
export async function getDockerEngineUpdateCheck(): Promise<
  DockerUpdateStatus
> {
  const info = await getDockerEnginehostInfo().catch(e => {
    e.message = `Error getting docker engine host info: ${e.message}`;
    throw e;
  });
  return parseDockerEngineRequirements(info);
}

// Docker compose

/**
 * Updates docker compose
 */
export async function updateDockerCompose(): Promise<string> {
  return await updateDockerComposeScript().catch(e => {
    e.message = `Error updating docker compose: ${e.message}`;
    throw e;
  });
}

/**
 * Returns docker-compose version
 */
export async function getDockerComposeUpdateCheck(): Promise<
  DockerUpdateStatus
> {
  const info = await getDockerComposeVersion().catch(e => {
    e.message = `Error getting docker engine host info: ${e.message}`;
    throw e;
  });
  return parseDockerComposeRequirements(info);
}
