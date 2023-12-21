import {
  disconnectAllContainersFromNetwork,
  docker,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import Dockerode from "dockerode";
import { getDockerNetworkNameFromSubnet } from "./getDockerNetworkNameFromSubnet.js";
import { recreateDockerNetwork } from "./recreateDockerNetwork.js";
import { connectContainersToNetworkWithPrio } from "./connectContainersToNetworkWithPrio.js";
import { params } from "@dappnode/params";

// TODO: every docker.network.connect should have the docker aliases

/**
 * Ensures the docker network defined has the following config:
 * - docker network name: "dncore_network"
 * - docker network subnet: "172.33.0.0/16"
 * - dappmanager container has assigned ip: "172.33.1.7"
 * - bind container has assigned ip: "172.33.1.2"
 * - All docker containers prefixed with "DAppnNodeCore-" || "DAppnodePackage-" are connected to it
 * - dappmanager and bind
 */
export async function ensureDockerNetworkConfig({
  dockerNetworkName,
  dockerNetworkSubnet,
  dappmanagerIp,
  bindIp,
}: {
  dockerNetworkName: string;
  dockerNetworkSubnet: string;
  dappmanagerIp: string;
  bindIp: string;
}): Promise<void> {
  let restartWireguardIsRequired = false;
  const dncoreNetwork = docker.getNetwork(dockerNetworkName);

  try {
    // make sure docker network exists
    const dncoreNetworkInspect: Dockerode.NetworkInspectInfo =
      await dncoreNetwork.inspect();

    logs.info(`docker network ${dncoreNetwork.id} exists`);

    const dncoreNetworkIpamConfig = dncoreNetworkInspect.IPAM?.Config;
    // check network config exists
    if (dncoreNetworkIpamConfig && "Subnet" in dncoreNetworkIpamConfig[0]) {
      // validate ip rage
      if (dncoreNetworkIpamConfig[0].Subnet !== dockerNetworkSubnet) {
        // IMPORTANT: this is the loop that must be entered when migrating IP range
        // invalid ip range
        restartWireguardIsRequired = true;
        logs.info(
          `docker network ${dockerNetworkName} has invalid subnet ${dncoreNetworkIpamConfig[0].Subnet} it should be ${dockerNetworkSubnet}, migrating`
        );
        await recreateDockerNetwork({
          dockerNetworkName: dockerNetworkName,
          dockerNetworkSubnet: dockerNetworkSubnet,
        });
      } else {
        // IMPORTANT: this is the loop that must be entered if not migration
        // valid ip range
        logs.info(
          `docker network ${dockerNetworkName} has valid subnet ${dockerNetworkSubnet}`
        );
      }
    } else {
      logs.error(
        `docker network ${dockerNetworkName} does not have network config`
      );
      await recreateDockerNetwork({
        dockerNetworkName: dockerNetworkName,
        dockerNetworkSubnet: dockerNetworkSubnet,
      });
    }

    // connect all containers
    await connectContainersToNetworkWithPrio({
      networkName: dockerNetworkName,
      dappmanagerIp,
      bindIp,
    });
  } catch (e) {
    // Error: (HTTP code 404) no such network - network dncore_network not found
    // TODO: consider comparing also e.message
    if (e.statusCode === 404) {
      try {
        // dncore_network does not exist create it
        logs.warn(
          `docker network ${dockerNetworkName} not found, creating it...`
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
        // connect all containers
        await connectContainersToNetworkWithPrio({
          networkName: dockerNetworkName,
          dappmanagerIp,
          bindIp,
        });
      } catch (e) {
        // Error when creating docker network with overlapping address space:
        // Error: (HTTP code 403) unexpected - Pool overlaps with other one on this address space
        // TODO: consider comparing also error.message
        if (e.statusCode === 403) {
          logs.warn(`Another docker network already has subnet assigned: ${e}`);
          const dockerNetworkToRemoveName =
            await getDockerNetworkNameFromSubnet(dockerNetworkSubnet);
          if (!dockerNetworkToRemoveName)
            throw Error(
              `could not be found the docker network with subnet ${dockerNetworkSubnet}`
            );
          // disconnect all the containers
          logs.info(`disconnecting all containers from ${dockerNetworkName}`);
          await disconnectAllContainersFromNetwork(dockerNetworkToRemoveName);
          // delete network with invalid ip range
          logs.info(`removing docker network ${dockerNetworkToRemoveName}`);
          await docker.getNetwork(dockerNetworkToRemoveName).remove();
          // create again docker network
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
          // connect all containers
          await connectContainersToNetworkWithPrio({
            networkName: dockerNetworkName,
            dappmanagerIp,
            bindIp,
          });
        } else throw e;
      }
    } else throw e;
  } finally {
    // restart wireguard if required
    if (restartWireguardIsRequired) {
      await docker
        .getContainer(params.WIREGUARD_CONTAINER_NAME)
        .restart()
        .catch((e) => {
          if (e.statusCode === 404) {
            // wireguard container does not exist
            logs.info(`${params.WIREGUARD_CONTAINER_NAME} not found`);
          } else throw e;
        });
      logs.info(
        `restarted ${params.WIREGUARD_CONTAINER_NAME} container to reroute requests`
      );
    }
  }
}
