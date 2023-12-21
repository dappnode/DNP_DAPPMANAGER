import Dockerode from "dockerode";
import { docker } from "./docker.js";
import { dockerContainerInspect } from "../index.js";

/**
 * Returns a map of container names to their network aliases
 * @param networkName "dncore_network"
 * @returns { "DAppNodeCore-dappmanager.dnp.dappnode.eth": ["my.dappnode", "dappmanager.dappnode", "dappmanager.dnp.dappnode.eth.dappnode", "dappnode.local"] }
 */
export async function getNetworkAliasesMap(
  networkName: string
): Promise<Map<string, string[]>> {
  const network = docker.getNetwork(networkName);
  const networkInfo: Dockerode.NetworkInspectInfo = (await network.inspect() as Dockerode.NetworkInspectInfo);

  const containersInfo = Object.values(networkInfo.Containers ?? []);

  return await getContainerAliasesForNetwork(containersInfo, networkName);
}

async function getContainerAliasesForNetwork(containersInfo: Dockerode.NetworkContainer[], networkName: string): Promise<Map<string, string[]>> {
  const fetchAliasesTasks = containersInfo.map(async (containerInfo) => {
    try {
      const aliases = (await getNetworkContainerConfig(containerInfo.Name, networkName))?.Aliases ?? [];
      return { name: containerInfo.Name, aliases };
    } catch (error) {
      console.error(`Failed to get aliases for container ${containerInfo.Name}:`, error);
      return { name: containerInfo.Name, aliases: [] };
    }
  });

  const containersAliases = await Promise.all(fetchAliasesTasks);
  const aliasMap = new Map(containersAliases.map(({ name, aliases }) => [name, aliases]));

  return aliasMap;
}

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
  endpointConfig?: Partial<Dockerode.NetworkInfo>,
): Promise<void> {
  try {
    await dockerNetworkConnect(networkName, containerName, endpointConfig);
  } catch (e) {
    if (e.statusCode === 403 && e.message.includes("already exists")) {
      // Error: (HTTP code 403) unexpected - endpoint with name DAppNodeCore-dappmanager.dnp.dappnode.eth already exists in network dncore_network
      // container already exists in the network
      // bypass error
    } else if (
      e.statusCode === 500 &&
      e.message.includes("could not find a network matching network mode")
    ) {
      // Error: (HTTP code 500) server error - could not find a network matching network mode dncore_network: network dncore_network not found
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

/**
 * Returns the network configuration for a container in a specific network
 */
export async function getNetworkContainerConfig(
  containerName: string,
  networkName: string
): Promise<Dockerode.NetworkInfo | null> {
  const inspectInfo = await dockerContainerInspect(containerName);
  return (
    inspectInfo.NetworkSettings.Networks[networkName] ??
    null
  );
}
