import {
  disconnectAllContainersFromNetwork,
  docker,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import Dockerode from "dockerode";
import { subnetsOverlap } from "./subnetsOverlap.js";

/**
 * Ensures a docker network configuration for a given parameters:
 *
 * - docker network "networkName" exists and it has assigned the subnet "networkSubnet"
 * - All the previous docker containers mut be still connected to it at the end with the same
 * aliases
 *
 * This function takes into account the following edge cases:
 * - 404 network not found
 * - 403 other network overlapping the address
 *
 * @param networkName "dncore_network"
 * @param networkSubnet "172.33.0.1/16"
 */
export async function ensureDockerNetworkConfig({
  networkName,
  networkSubnet,
}: {
  networkName: string;
  networkSubnet: string;
}): Promise<{ network: Dockerode.Network; isNetworkRecreated: boolean }> {
  const networkOptions: Dockerode.NetworkCreateOptions = {
    Name: networkName,
    Driver: "bridge",
    IPAM: {
      Driver: "default",
      Config: [
        {
          Subnet: networkSubnet,
        },
      ],
    },
  };

  try {
    const dncoreNetwork = docker.getNetwork(networkName);
    // docker network inspect
    // https://docs.docker.com/engine/api/v1.43/#tag/Network/operation/NetworkInspect
    const networkInspect: Dockerode.NetworkInspectInfo =
      await dncoreNetwork.inspect(); // throws 404 if network not found

    logs.info(`docker network ${networkName} exists`);

    if (isNetworkOverlappingSubnet(networkInspect, networkSubnet)) {
      // network subnet is as expected
      logs.info(
        `docker network ${networkName} has correct subnet ${networkSubnet}`
      );
      return { network: dncoreNetwork, isNetworkRecreated: false };
    } else {
      logs.warn(
        `docker network ${networkName} has incorrect subnet ${networkInspect.IPAM?.Config?.[0]}, it should be ${networkSubnet}. Recreating it...`
      );
      await removeNetworksOverlappingSubnetIfNeeded(networkSubnet);
      const network = await recreateDockerNetwork(
        dncoreNetwork,
        networkOptions
      );
      return { network, isNetworkRecreated: true };
    }
  } catch (e) {
    if (e.statusCode === 404) {
      // docker network not found, create it
      logs.warn(`docker network ${networkName} not found, creating it...`);

      await removeNetworksOverlappingSubnetIfNeeded(networkSubnet);
      const network = await docker.createNetwork(networkOptions);
      return { network, isNetworkRecreated: true };
    } else {
      // TODO: What do we do here?
      throw e;
    }
  }
}

/**
 * Removes any network whose subnet overlaps with the one provided as argument
 * The error thrown when trying to create a network with an overlapping subnet is:
 * Error: (HTTP code 403) unexpected - Pool overlaps with other one on this address space
 */
async function removeNetworksOverlappingSubnetIfNeeded(
  networkSubnet: string
): Promise<void> {
  const networks = await docker.listNetworks();

  const overlappingNetworks = networks.filter((network) =>
    isNetworkOverlappingSubnet(network, networkSubnet)
  );

  if (overlappingNetworks.length > 0) {
    logs.info(
      `Found ${overlappingNetworks.length} networks to remove (overlapping subnet)`
    );

    await Promise.all(
      overlappingNetworks.map(async (networkInfo) => {
        const networkName = networkInfo.Name;
        const network = docker.getNetwork(networkName);
        await disconnectAllContainersFromNetwork(network);
        await network.remove();
      })
    );
  } else logs.info(`No overlapping network found`);
}

/**
 * Checks if a given subnet overlaps with any of the subnets in a Docker network.
 * @param network - Docker network information as provided by Dockerode.
 * @param subnet - A string representing the subnet in CIDR notation to check for overlap.
 * @returns True if there is an overlap with any of the network's subnets, false otherwise.
 */
function isNetworkOverlappingSubnet(
  network: Dockerode.NetworkInspectInfo,
  subnet: string
): boolean {
  const networkSubnets = network.IPAM?.Config?.map(config => config.Subnet) ?? [];

  return networkSubnets.some(networkSubnet => networkSubnet && subnetsOverlap(networkSubnet, subnet));
}

/**
 * Recreates the docker network with the configuration defined in networkOptions:
 *
 * 1. Disconnect al docker containers from a docker network
 * 2. Remove the docker network
 * 3. Creates again the docker network with the config
 *
 * @param networkToRemove dockerode network to remove
 * @param newNetworkOptions dockerorde create options object
 */
async function recreateDockerNetwork(
  networkToRemove: Dockerode.Network,
  newNetworkOptions: Dockerode.NetworkCreateOptions
): Promise<Dockerode.Network> {
  logs.info(`disconnecting all containers from ${networkToRemove.id}`);
  await disconnectAllContainersFromNetwork(networkToRemove);

  logs.info(`removing docker network ${networkToRemove.id}`);
  await networkToRemove.remove();

  // create network with valid range
  logs.info(
    `creating docker network ${newNetworkOptions.Name} with valid IP range`
  );

  return await docker.createNetwork(newNetworkOptions);
}
