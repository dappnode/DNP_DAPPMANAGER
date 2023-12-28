import { docker } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import Dockerode from "dockerode";
import { isNetworkOverlappingSubnet } from "./isNetworkOverlappingSubnet.js";
import { recreateDockerNetwork } from "./recreateDockerNetwork.js";
import { removeNetworksOverlappingSubnetIfNeeded } from "./removeNetworksOverlappingSubnetIfNeeded.js";

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
        `docker network ${networkName} has incorrect subnet ${networkInspect.IPAM?.Config?.[0].Subnet}, it should be ${networkSubnet}. Recreating it...`
      );
      await removeNetworksOverlappingSubnetIfNeeded(networkSubnet).catch((e) =>
        logs.error(`error removing overlapping networks: ${e}`)
      );
      // CRITICAL: if this step fails migration failure
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

      await removeNetworksOverlappingSubnetIfNeeded(networkSubnet).catch((e) =>
        logs.error(`error removing overlapping networks: ${e}`)
      );
      // CRITICAL: if this step fails migration failure
      const network = await docker.createNetwork(networkOptions);
      return { network, isNetworkRecreated: true };
    } else {
      // TODO: What do we do here?
      throw e;
    }
  }
}
