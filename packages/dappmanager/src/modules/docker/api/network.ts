import { docker } from "./docker";

/**
 * Connect a container to a network
 * @param networkName "dncore_network"
 * @param containerName "3613f73ba0e4" or "fullcontainername"
 * @param aliases `["network-alias"]`
 */
export async function dockerNetworkConnect(
  networkName: string,
  containerName: string,
  aliases?: string[]
): Promise<void> {
  const network = docker.getNetwork(networkName);
  await network.connect({
    Container: containerName,
    Aliases: aliases
  });
}

/**
 * Disconnect a container from a network
 * @param networkName "dncore_network"
 * @param containerName "3613f73ba0e4" or "fullcontainername"
 * @param aliases `["network-alias"]`
 */
export async function dockerNetworkDisconnect(
  networkName: string,
  containerName: string
): Promise<void> {
  const network = docker.getNetwork(networkName);
  await network.disconnect({
    Container: containerName,
    // Force the container to disconnect from the network
    Force: true
  });
}

/**
 * Create a new docker network
 */
export async function dockerCreateNetwork(networkName: string): Promise<void> {
  await docker.createNetwork({
    Name: networkName,
    // Check for networks with duplicate names. Since Network is primarily
    // keyed based on a random ID and not on the name, and network name is
    // strictly a user-friendly alias to the network which is uniquely
    // identified using ID, there is no guaranteed way to check for duplicates.
    // CheckDuplicate is there to provide a best effort checking of any networks
    // which has the same name but it is not guaranteed to catch all name
    // collisions.
    CheckDuplicate: true,
    // Default plugin
    Driver: "bridge"
  });
}

interface ListNetworksItem {
  Name: string; // "bridge";
  Id: string; // "f2de39df4171b0dc801e8002d1d999b77256983dfc63041c0f34030aa3977566";
  Created: string; // "2016-10-19T06:21:00.416543526Z";
  Scope: string; // "local";
  Driver: string; // "bridge";
  EnableIPv6: boolean; // false;
  Internal: boolean; // false;
  Attachable: boolean; // false;
  Ingress: boolean; // false;
  IPAM: {};
  Containers: {};
  Options: {};
}

export async function dockerListNetworks(): Promise<ListNetworksItem[]> {
  return await docker.listNetworks();
}
