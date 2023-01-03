import { DockerUpdateStatus } from "@dappnode/common";
import {
  getDockerComposeVersion,
  getDockerEnginehostInfo,
  updateDockerCompose as updateDockerComposeScript
} from "../hostScripts";
import { updateDockerEngine as updateDockerEngineService } from "../hostServices";
import {
  parseDockerComposeRequirements,
  parseDockerEngineRequirements
} from "./utils";

// Docker engine

/**
 * Updates docker engine:
 * - Must be done through a service instead of a script
 * - Will break docker engine communctation
 * - Containers will restart
 * - Cannot be done executing a script (due to the linux child process hierarchy)
 */
export async function updateDockerEngine(): Promise<string> {
  return await updateDockerEngineService().catch(e => {
    e.message = `Error updating docker engine: ${e.message}`;
    throw e;
  });
}

/**
 * Returns host info required to update docker engine.
 */
export async function getDockerEngineUpdateCheck(): Promise<DockerUpdateStatus> {
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
export async function getDockerComposeUpdateCheck(): Promise<DockerUpdateStatus> {
  const info = await getDockerComposeVersion().catch(e => {
    e.message = `Error getting docker engine host info: ${e.message}`;
    throw e;
  });
  return parseDockerComposeRequirements(info);
}
