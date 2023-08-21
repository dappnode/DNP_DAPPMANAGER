import Dockerode from "dockerode";
import { docker } from "./docker.js";

/**
 * Connect a container to a network
 * @param networkName "dncore_network"
 * @param containerName "3613f73ba0e4" or "fullcontainername"
 * @param aliases `["network-alias"]`
 */
export async function dockerNetworkConnect(
  networkName: string,
  containerName: string,
  endpointConfig?: Partial<Dockerode.NetworkInfo>
): Promise<void> {
  const network = docker.getNetwork(networkName);
  await network.connect({
    Container: containerName,
    EndpointConfig: endpointConfig
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

export async function dockerListNetworks(): Promise<
  Dockerode.NetworkInspectInfo[]
> {
  return await docker.listNetworks();
}
