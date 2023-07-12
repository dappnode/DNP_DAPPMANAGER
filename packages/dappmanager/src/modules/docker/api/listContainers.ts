import Docker from "dockerode";
import { docker } from "./docker.js";

export function listContainers(
  options: DockerApiListContainerOptions
): Promise<Docker.ContainerInfo[]> {
  // Change all default value from false to true
  return docker.listContainers({ all: true, ...options });
}

export interface DockerApiListContainerOptions {
  all?: boolean; // Return all containers. By default, only running (false)
  limit?: number; // Return this number of most recently created containers, including non-running ones.
  size?: boolean; // Return the size of container as fields SizeRw and SizeRootFs. (false)
  filters?: {
    ancestor?: string; // "(<image-name>[:<tag>], <image id>, or <image@digest>)";
    before?: string; // "(<container id> or <container name>)";
    expose?: string; // "(<port>[/<proto>]|<startport-endport>/[<proto>])";
    exited?: string; // "<int> containers with exit code of <int>";
    health?: string; // "(starting|healthy|unhealthy|none)";
    // MUST be an array of: [byId]
    id?: string[]; // "<ID> a container's ID";
    isolation?: string; // "(default|process|hyperv) (Windows daemon only)";
    "is-task"?: string; //"(true|false)";
    label?: string; // "key or label='key=value' of a container label";
    // MUST be an array of: [byName]
    name?: string[]; // "<name> a container's name";
    network?: string; // "(<network id> or <network name>)";
    publish?: string; // "(<port>[/<proto>]|<startport-endport>/[<proto>])";
    since?: string; // "(<container id> or <container name>)";
    status?: string; // "(created|restarting|running|removing|paused|exited|dead)";
    volume?: string; // "(<volume name> or <mount point destination>)";
  };
}
