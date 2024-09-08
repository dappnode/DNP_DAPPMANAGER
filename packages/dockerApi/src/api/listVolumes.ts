import { docker } from "./docker.js";

export async function dockerVolumesList(options?: DockerApiListVolumesOptions): Promise<DockerVolumeListItem[]> {
  const { Volumes } = await docker.listVolumes({ filters: options });
  // Return is not correctly typed, casting to actual tested values
  return Volumes as DockerVolumeListItem[];
}

export interface DockerApiListVolumesOptions {
  dangling?: boolean; // When set to true (or 1), returns all volumes that are not in use by a container. When set to false (or 0), only volumes that are in use by one or more containers are returned.
  driver?: string[]; // <volume-driver-name> Matches volumes based on their driver.
  label?: string[]; // "key or label='key=value' of a container label";
  // MUST be an array of: [byName]
  name?: string[]; // "<name> a container's name";
}

export interface DockerVolumeListItem {
  CreatedAt: string; // "2019-12-10T11:54:22+01:00";
  Driver: string; // "local";
  Labels: { [labelKey: string]: string }; // { "com.docker.compose.version": "1.22.0" };
  Mountpoint: string; // "/var/lib/docker/volumes/nginx.dnp.dappnode.eth-data/_data";
  Name: string; // "nginx.dnp.dappnode.eth-data";
  Options: null | { device: string; o: string; type: string };
  // { device: "/demo/Code/dappnode/test/compose-test/data", o: "bind", type: "none" },
  Scope: string; // "local";
}
