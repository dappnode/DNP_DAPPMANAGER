import {
  updateDockerCompose,
  updateDockerEngine,
  getDockerComposeUpdateCheck,
  getDockerEngineUpdateCheck
} from "../modules/dockerUpdate";
import { DockerUpdateStatus } from "@dappnode/common";

/**
 * Updates docker engine
 */
export async function dockerEngineUpdate(): Promise<string> {
  return await updateDockerEngine();
}

/**
 * Docker engine requirements
 */
export async function dockerEngineUpdateCheck(): Promise<DockerUpdateStatus> {
  return await getDockerEngineUpdateCheck();
}

/**
 * Updates docker compose
 */
export async function dockerComposeUpdate(): Promise<string> {
  return await updateDockerCompose();
}

/**
 * Docker compose requirements
 */
export async function dockerComposeUpdateCheck(): Promise<DockerUpdateStatus> {
  return await getDockerComposeUpdateCheck();
}
