import { docker } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";
import Dockerode from "dockerode";
import { getDockerNetworkNameFromSubnet } from "./getDockerNetworkNameFromSubnet.js";
import { recreateDockerNetwork } from "./recreateDockerNetwork.js";
import { connectContainersToNetworkWithPrio } from "./connectContainersToNetworkWithPrio.js";

const dncoreNetworkName = params.DOCKER_PRIVATE_NETWORK_NAME;
const dncoreNetworkSubnet = params.DOCKER_NETWORK_SUBNET;

// TODO: make sure hardcoded ips are CORRECT: dappmanager and bind
// TODO: publish core packages without hardcoded IPs??

/**
 * Ensures the docker network defined has the following config:
 * - docker network name: "dncore_network"
 * - docker network subnet: "172.33.0.0/16"
 * - dappmanager container has assigned ip: "172.33.1.7"
 * - bind container has assigned ip: "172.33.1.2"
 * - All docker containers prefixed with "DAppnNodeCore-" || "DAppnodePackage-" are connected to it
 * - dappmanager and bind
 */
export async function ensureDockerNetworkConfig(): Promise<void> {
  const dncoreNetwork = docker.getNetwork(dncoreNetworkName);

  try {
    // make sure docker network exists
    const dncoreNetworkInspect: Dockerode.NetworkInspectInfo =
      await dncoreNetwork.inspect();

    logs.info(`docker network ${dncoreNetwork.id} exists`);

    const dncoreNetworkIpamConfig = dncoreNetworkInspect.IPAM?.Config;
    // check network config exists
    if (dncoreNetworkIpamConfig && "Subnet" in dncoreNetworkIpamConfig[0]) {
      // validate ip rage
      if (dncoreNetworkIpamConfig[0].Subnet !== dncoreNetworkSubnet) {
        // IMPORTANT: this is the loop that must be entered when migrating IP range
        // invalid ip range
        logs.info(
          `docker network ${dncoreNetworkName} has invalid subnet ${dncoreNetworkIpamConfig[0].Subnet} it should be ${dncoreNetworkSubnet}, migrating`
        );
        await recreateDockerNetwork({
          dockerNetworkName: dncoreNetworkName,
          dockerNetworkSubnet: dncoreNetworkSubnet,
        });
      } else {
        // IMPORTANT: this is the loop that must be entered if not migration
        // valid ip range
        logs.info(
          `docker network ${dncoreNetworkName} has valid subnet ${dncoreNetworkSubnet}`
        );
      }
    } else {
      logs.error(
        `docker network ${dncoreNetworkName} does not have network config`
      );
      await recreateDockerNetwork({
        dockerNetworkName: dncoreNetworkName,
        dockerNetworkSubnet: dncoreNetworkSubnet,
      });
    }

    // connect all containers
    await connectContainersToNetworkWithPrio(dncoreNetworkName);
  } catch (e) {
    // Error: (HTTP code 404) no such network - network dncore_network not found
    if (e.statusCode === 404) {
      try {
        // dncore_network does not exist create it
        logs.warn(
          `docker network ${dncoreNetworkName} not found, creating it...`
        );
        await docker.createNetwork({
          Name: dncoreNetworkName,
          Driver: "bridge",
          IPAM: {
            Driver: "default",
            Config: [
              {
                Subnet: dncoreNetworkSubnet,
              },
            ],
          },
        });
        // connect all containers
        await connectContainersToNetworkWithPrio(dncoreNetworkName);
      } catch (e) {
        // Error when creating docker network with overlapping address space:
        // Error: (HTTP code 403) unexpected - Pool overlaps with other one on this address space
        if (e.statusCode === 403) {
          logs.warn(`Another docker network already has subnet assigned: ${e}`);
          const dockerNetworkToRemoveName =
            await getDockerNetworkNameFromSubnet(dncoreNetworkSubnet);
          if (!dockerNetworkToRemoveName)
            throw Error(
              `could not be found the docker network with subnet ${dncoreNetworkSubnet}`
            );
          logs.warn(`docker network to remove: ${dockerNetworkToRemoveName}`);
          await recreateDockerNetwork({
            dockerNetworkName: dockerNetworkToRemoveName,
            dockerNetworkSubnet: dncoreNetworkSubnet,
          });
          // connect all containers
          await connectContainersToNetworkWithPrio(dncoreNetworkName);
        } else throw e;
      }
    } else throw e;
  }
}
