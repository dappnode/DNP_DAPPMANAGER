import {
  docker,
  disconnectAllContainersFromNetwork,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { isNetworkOverlappingSubnet } from "./isNetworkOverlappingSubnet.js";

/**
 * Removes any network whose subnet overlaps with the one provided as argument
 * The error thrown when trying to create a network with an overlapping subnet is:
 * Error: (HTTP code 403) unexpected - Pool overlaps with other one on this address space
 */
export async function removeNetworksOverlappingSubnetIfNeeded(
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
        const network = docker.getNetwork(networkInfo.Name);
        await disconnectAllContainersFromNetwork(network);
        await network.remove();
      })
    );
  } else logs.info(`No overlapping network found`);
}
