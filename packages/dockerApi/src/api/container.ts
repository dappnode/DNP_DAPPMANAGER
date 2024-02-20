import Docker from "dockerode";
import { docker } from "./docker.js";

/**
 * Inspect container
 * @param containerNameOrId "DAppNodePackage-geth.dnp.dappnode.eth"
 */
export async function dockerContainerInspect(
  containerNameOrId: string
): Promise<Docker.ContainerInspectInfo> {
  return await docker.getContainer(containerNameOrId).inspect();
}

export async function dockerContainerStart(
  containerNameOrId: string
): Promise<Docker.ContainerInspectInfo> {
  return await docker.getContainer(containerNameOrId).start();
}

export async function dockerContainerStop(
  containerNameOrId: string,
  options?: DockerStopOptions
): Promise<Docker.ContainerInspectInfo> {
  return await docker
    .getContainer(containerNameOrId)
    .stop({ t: options?.timeout });
}

export async function dockerContainerKill(
  containerNameOrId: string
): Promise<Docker.ContainerInspectInfo> {
  return await docker.getContainer(containerNameOrId).kill();
}

export async function dockerContainerRestart(
  containerNameOrId: string,
  options?: DockerStopOptions
): Promise<Docker.ContainerInspectInfo> {
  return await docker
    .getContainer(containerNameOrId)
    .restart({ t: options?.timeout });
}

export async function dockerContainerRemove(
  containerNameOrId: string,
  options?: DockerRemoveOptions
): Promise<Docker.ContainerInspectInfo> {
  return await docker
    .getContainer(containerNameOrId)
    .remove({ force: true, v: options?.volumes });
}

interface DockerStopOptions {
  /**
   * Number of seconds to wait before killing the container
   */
  timeout?: number;
}

interface DockerRemoveOptions {
  /**
   * Remove anonymous volumes associated with the container.
   */
  volumes?: boolean;
}
