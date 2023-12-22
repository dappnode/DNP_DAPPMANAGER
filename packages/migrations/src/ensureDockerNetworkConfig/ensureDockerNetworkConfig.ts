import {
  docker,
  getNetworkAliasesMap,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { connectContainersToNetworkWithPrio } from "./connectContainersToNetworkWithPrio.js";
import { params } from "@dappnode/params";
import { getNetworkOverridingOthers } from "./getNetworkOverridingOthers.js";

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

  // If the network is not found, it will return an empty map
  const aliasesMap = await getNetworkAliasesMap(dockerNetworkName);

  const { network, isNetworkRecreated } = await getNetworkOverridingOthers({ networkName: dockerNetworkName, networkSubnet: dockerNetworkSubnet });

  try {
    // connect all containers
    await connectContainersToNetworkWithPrio({
      network: network,
      dappmanagerIp,
      bindIp,
      aliasesMap
    });
  } catch (e) {
    logs.error(`Failed to connect containers to network ${dockerNetworkName}`);
    // TODO: What do we do here?
    throw e;
  } finally {
    if (isNetworkRecreated) {
      await docker
        .getContainer(params.wireguardContainerName)
        .restart()
        .catch((e) => {
          if (e.statusCode === 404) {
            logs.info(`${params.wireguardContainerName} not found`);
          } else throw e; // TODO: What do we do here?
        });
      logs.info(
        `restarted ${params.wireguardContainerName} container to reroute requests`
      );
    }
  }
}
