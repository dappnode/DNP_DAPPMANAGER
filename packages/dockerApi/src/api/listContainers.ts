import Docker, { ContainerListOptions } from "dockerode";
import { docker } from "./docker.js";

export function listContainers(
  options: ContainerListOptions
): Promise<Docker.ContainerInfo[]> {
  // Change all default value from false to true
  return docker.listContainers({ all: true, ...options });
}
