import Dockerode from "dockerode";
import { docker } from "./docker.js";
import { dockerContainerInspect } from "../index.js";
import { params } from "@dappnode/params";

/**
 * Disconnect all docker containers from a docker network
 * @param networkName "dncore_network"
 */
export async function disconnectAllContainersFromNetwork(
  networkName: string
): Promise<void> {
  const network = docker.getNetwork(networkName);
  const containers = ((await network.inspect()) as Dockerode.NetworkInspectInfo)
    .Containers;
  if (containers)
    await Promise.all(
      Object.values(containers).map(
        async (c) =>
          await network.disconnect({ Container: c.Name, Force: true })
      )
    );
}

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
    EndpointConfig: endpointConfig,
  });
}

/**
 * Connect a container to a network
 * @param networkName "dncore_network"
 * @param containerName "3613f73ba0e4" or "fullcontainername"
 * @param aliases `["network-alias"]`
 */
export async function dockerNetworkConnectNotThrow(
  networkName: string,
  containerName: string,
  endpointConfig?: Partial<Dockerode.NetworkInfo>
): Promise<void> {
  try {
    await dockerNetworkConnect(networkName, containerName, endpointConfig);
  } catch (e) {
    if (e.statusCode === 403) {
      // Error: (HTTP code 403) unexpected - endpoint with name DAppNodeCore-dappmanager.dnp.dappnode.eth already exists in network dncore_network
      // container already exists in the network
      // bypass error
    } else if (
      e.statusCode === 500 &&
      e.message.includes("could not find a network matching network mode")
    ) {
      // Error: (HTTP code 500) server error - could not find a network matching network mode dncore_network: network dncore_network not found
      console.error(e);
    } else throw e;
  }
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
    Force: true,
  });
}

/**
 * Disconnects and reconnects a container to a network
 * @param networkName "dncore_network"
 * @param containerName "3613f73ba0e4" or "fullcontainername"
 * @param aliases `["network-alias"]`
 */
export async function dockerNetworkReconnect(
  networkName: string,
  containerName: string,
  endpointConfig?: Partial<Dockerode.NetworkInfo>
): Promise<void> {
  await dockerNetworkDisconnect(networkName, containerName);
  await dockerNetworkConnect(networkName, containerName, endpointConfig);
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
    Driver: "bridge",
  });
}

export async function dockerListNetworks(): Promise<
  Dockerode.NetworkInspectInfo[]
> {
  return await docker.listNetworks();
}

/** Get endpoint config for DOCKER_PRIVATE_NETWORK_NAME */
export async function getDnCoreNetworkContainerConfig(
  containerName: string
): Promise<Dockerode.NetworkInfo | null> {
  const inspectInfo = await dockerContainerInspect(containerName);
  return (
    inspectInfo.NetworkSettings.Networks[params.DOCKER_PRIVATE_NETWORK_NAME] ??
    null
  );
}
