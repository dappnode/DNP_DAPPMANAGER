import {
  disconnectAllContainersFromNetwork,
  docker,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";

/**
 * Recreates the docker network with the following network configuration:
 * - name: dockerNewNetworkName
 * - Driver: "bridge"
 * - IPAM:
 *  - Driver: "default"
 *  - subnet: dncoreNetworkSubnet
 *
 * @param dockerNetworkToRemove "" docker network to remove
 * @param dockerNewNetworkName "dncore_network"
 */
export async function recreateDockerNetwork({
  dockerNetworkName,
  dockerNetworkSubnet,
}: {
  dockerNetworkName: string;
  dockerNetworkSubnet: string;
}): Promise<void> {
  // disconnect all the containers
  logs.info(`disconnecting all containers from ${dockerNetworkName}`);
  await disconnectAllContainersFromNetwork(dockerNetworkName);
  // delete network with invalid ip range
  logs.info(`removing docker network ${dockerNetworkName}`);
  await docker.getNetwork(dockerNetworkName).remove();
  // create network with valid range
  logs.info(
    `creating docker networtk ${dockerNetworkName} with valid ip range`
  );
  await docker.createNetwork({
    Name: dockerNetworkName,
    Driver: "bridge",
    IPAM: {
      Driver: "default",
      Config: [
        {
          Subnet: dockerNetworkSubnet,
        },
      ],
    },
  });
}
