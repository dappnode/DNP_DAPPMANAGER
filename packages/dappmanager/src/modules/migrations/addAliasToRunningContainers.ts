import { ComposeNetwork, ComposeServiceNetwork } from "@dappnode/types";
import Dockerode from "dockerode";
import { uniq } from "lodash-es";
import { PackageContainer } from "@dappnode/common";
import { getPrivateNetworkAliases } from "../../domains.js";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";
import { parseComposeSemver } from "../../utils/sanitizeVersion.js";
import shell from "../../utils/shell.js";
import { ComposeFileEditor } from "../compose/editor.js";
import { parseServiceNetworks } from "../compose/networks.js";
import {
  dockerComposeUp,
  dockerNetworkDisconnect,
  dockerNetworkConnect
} from "../docker/index.js";
import { listContainers } from "../docker/list/index.js";
import * as getPath from "../../utils/getPath.js";
import { gte } from "semver";
import { getDnCoreNetworkContainerConfig } from "../docker/api/network.js";

/** Alias for code succinctness */
const dncoreNetworkName = params.DNP_PRIVATE_NETWORK_NAME;

/**
 * DAPPMANAGER updates from <= v0.2.38 must manually add aliases
 * to all running containers.
 * This will run every single time dappmanager restarts and will list al packages
 * and do docker inspect. This migration tries to assure that:
 * Having a package name "example.dnp.dappnode.eth" the aliases should be:
 * "example.dappnode" if the package is mono service
 * "service1.example.dappnode" if the package is multiservice
 * "service1.example.dappnode" and "example.dappnode" if the package is multiservice and has in manifest mainservice
 */
export async function addAliasToRunningContainers(): Promise<void> {
  try {
    const containers = await listContainers();
    await addAliasToGivenContainers(containers);
  } catch (error) {
    logs.error('Error adding alias to running containers:', error);
  }
}

export async function addAliasToGivenContainers(containers: PackageContainer[]): Promise<void> {
  for (const container of containers) {

    const isMainOrMonoService = container.isMain ?? false; // Set a default value of false if isMain is undefined
    const service = {
      serviceName: container.serviceName,
      dnpName: container.dnpName,
      isMain: isMainOrMonoService, // Add the isMain property here
    };
    const aliases = getPrivateNetworkAliases(service)
    
    // Adds aliases to the compose file that generated the container
    migrateCoreNetworkAndAliasInCompose(container, aliases);

    // Adds aliases to the container network
    for (const alias of aliases) {
      const currentEndpointConfig = await getDnCoreNetworkContainerConfig(container.containerName);
      if (!hasAlias(currentEndpointConfig, alias)) {
        const updatedConfig = updateEndpointConfig(currentEndpointConfig, alias);
        await updateContainerNetwork(dncoreNetworkName, container, updatedConfig);
        logs.info(`alias ${alias} added to ${container.containerName}`);
      }
    }
  }
}

/** Gets the docker-compose.yml file of the given `container` and adds one or more alias 
 * to the service that started `container`. All alias are added to the network defined by
 * `params.DNP_PRIVATE_NETWORK_NAME`.
 * 
 * @param container PackageContainer
 * @param aliases string[]
 * @returns void
 */
export function migrateCoreNetworkAndAliasInCompose(
  container: PackageContainer,
  aliases: string[]
): void {
  const compose = new ComposeFileEditor(container.dnpName, container.isCore);

  // Gets all the networks defined in the service
  const serviceNetworks = parseServiceNetworks(
    compose.services()[container.serviceName].get().networks || {}
  );
  
  // Gets current aliases of "params.DNP_PRIVATE_NETWORK_NAME", usually dncore_network
  const currentAliases = serviceNetworks[params.DNP_PRIVATE_NETWORK_NAME]?.aliases || [];

  //add new aliases to current aliases set
  const newAliases = uniq([...currentAliases, ...aliases]);

  // Gets the network "dncore_network" from the general compose file 
  const composeNetwork = compose.getComposeNetwork(params.DNP_PRIVATE_NETWORK_NAME);

  // Gets the old network "network" from the service compose file. This is an old network that is to be removed".
  // If it is already removed, return null
  const serviceNetwork = serviceNetworks[params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE] ?? null;

  // Return if migration was done, compose is already updated
  if (isComposeNetworkAndAliasMigrated(composeNetwork, serviceNetwork, compose.compose.version, newAliases)) return
  
  // Ensure/update compose file version 3.5
  compose.compose = {
    ...compose.compose,
    version: params.MINIMUM_COMPOSE_VERSION
  };

  // This tries to remove the old network called "network" from the container in the compose file
  // It is only done if network "network" exists or the new network "dncore_network" exists
  if (composeNetwork || serviceNetwork) {
    compose.services()[container.serviceName].removeNetwork(params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE);
  }

  // This adds the new network with the new aliases into the compose file
  compose.services()[container.serviceName].addNetwork(
    params.DNP_PRIVATE_NETWORK_NAME,
    { ...serviceNetwork, aliases: newAliases },
    { external: true, name: params.DNP_PRIVATE_NETWORK_NAME }
  );

  compose.write();
}

// function isMainServiceOfMultiServicePackage(container: PackageContainer): boolean {
//   const compose = new ComposeFileEditor(container.dnpName, container.isCore);
//   const services = compose.services(); // Invoke the services function
//   if (Object.keys(services).length > 1 && container.isMain) return true;
//   return false;
// }

function updateEndpointConfig(currentEndpointConfig: Dockerode.NetworkInfo | null, alias: string) {
  return {
    ...currentEndpointConfig,
    Aliases: [...(currentEndpointConfig?.Aliases || []), alias]
  };
}

async function updateContainerNetwork(networkName: string, container: any, endpointConfig: Partial<Dockerode.NetworkInfo>): Promise<void> {
  const containerName = container.containerName;

  // Wifi and VPN containers need a refresh connect due to their own network configuration
  if (containerName === params.vpnContainerName || containerName === params.wifiContainerName) {
    await shell(`docker rm ${containerName} --force`);
    await dockerComposeUp(getPath.dockerCompose(container.dnpName, container.isCore));
  } else {
    await dockerNetworkDisconnect(networkName, containerName);
    console.log(`new alias for: ${containerName}`);
    await dockerNetworkConnect(networkName, containerName, endpointConfig);
  }
}

/** Return true if endpoint config exists, has an array of Alisases and it contains the alias
 * @param alias
 * @returns boolean
 */
function hasAlias(
  endpointConfig: Dockerode.NetworkInfo | null,
  alias: string
): boolean {
  return Boolean(
    endpointConfig &&
    endpointConfig.Aliases &&
    Array.isArray(endpointConfig.Aliases) &&
    endpointConfig.Aliases.includes(alias)
  );
}

/** Return true if docker-compose.yml file has already been updated with aliases, false otherwise.
 * @param aliases
 * @returns boolean
 */
function isComposeNetworkAndAliasMigrated(
  composeNetwork: ComposeNetwork | null,
  serviceNetwork: ComposeServiceNetwork | null,
  composeVersion: string,
  aliases: string[]
): boolean {
  // 1. If we have not removed the old network "network" from the compose file, or
  //    we have not implemented the new network "dncore_network" in the compose file, return false. Migration is not already done.
  if (!composeNetwork || !serviceNetwork) return false; 

  // 2. Aside from being at least version 3.5, to consider the docker-compose.yml file as migrated, the network defined in the compose file must:
  //    - be external
  //    - have the expected name
  //    - have the expected aliases in each service
  if (
    composeNetwork?.name === params.DNP_PRIVATE_NETWORK_NAME && // Check expected name
    composeNetwork?.external && // Check is external network
    gte(
      parseComposeSemver(composeVersion),
      parseComposeSemver(params.MINIMUM_COMPOSE_VERSION)
    ) && // Check version is at least 3.5
    aliases.every(alias => serviceNetwork.aliases?.includes(alias)) // Check every alias is already present
  )
    return true;

  return false; // In other cases return false
}