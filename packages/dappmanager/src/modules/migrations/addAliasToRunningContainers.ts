import { ComposeNetwork, ComposeServiceNetwork } from "@dappnode/types";
import Dockerode from "dockerode";
import { uniq } from "lodash-es";
import { PackageContainer } from "@dappnode/common";
import { getPrivateNetworkAlias } from "../../domains.js";
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
    const aliasesToMigrate = [getPrivateNetworkAlias(container)];

    if (isMainServiceOfMultiServicePackage(container)) {
      aliasesToMigrate.push(getPrivateNetworkAlias({ dnpName: container.dnpName, serviceName: '' }));
    }

    migrateCoreNetworkAndAliasInCompose(container, aliasesToMigrate);

    for (const alias of aliasesToMigrate) {
      const currentEndpointConfig = await getDnCoreNetworkContainerConfig(container.containerName);
      if (!hasAlias(currentEndpointConfig, alias)) {
        const updatedConfig = updateEndpointConfig(currentEndpointConfig, alias);
        await updateContainerNetwork(dncoreNetworkName, container, updatedConfig);
        logs.info(`alias ${alias} added to ${container.containerName}`);
      }
    }
  }
}

export function migrateCoreNetworkAndAliasInCompose(
  container: PackageContainer,
  aliases: string[]
): void {
  const compose = new ComposeFileEditor(container.dnpName, container.isCore);

  // Extract existing service networks
  const serviceNetworks = parseServiceNetworks(
    compose.services()[container.serviceName].get().networks || {}
  );

  const currentAliases = serviceNetworks[params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE]?.aliases || [];
  const newAliases = uniq([...currentAliases, ...aliases]);

  // Check if migration was done
  const composeNetwork = compose.getComposeNetwork(params.DNP_PRIVATE_NETWORK_NAME);
  const serviceNetwork = serviceNetworks[params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE] ?? null;

  if (isComposeNetworkAndAliasMigrated(composeNetwork, serviceNetwork, compose.compose.version, newAliases)) return;

  // Ensure compose file version 3.5
  compose.compose = {
    ...compose.compose,
    version: params.MINIMUM_COMPOSE_VERSION
  };

  if (composeNetwork || serviceNetwork) {
    compose.services()[container.serviceName].removeNetwork(params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE);
  }

  compose.services()[container.serviceName].addNetwork(
    params.DNP_PRIVATE_NETWORK_NAME,
    { ...serviceNetwork, aliases: newAliases },
    { external: true, name: params.DNP_PRIVATE_NETWORK_NAME }
  );

  compose.write();
}

function isMainServiceOfMultiServicePackage(container: PackageContainer): boolean {
  const compose = new ComposeFileEditor(container.dnpName, container.isCore);
  const services = compose.services(); // Invoke the services function
  if (Object.keys(services).length > 1 && container.isMain) return true;
  return false;
}

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

function isComposeNetworkAndAliasMigrated(
  composeNetwork: ComposeNetwork | null,
  serviceNetwork: ComposeServiceNetwork | null,
  composeVersion: string,
  aliases: string[]
): boolean {
  // 1. Migration undone for aliases or networks or both => return false
  if (!composeNetwork || !serviceNetwork) return false; // Consider as not migrated if either composeNetwork or serviceNetwork are not present

  // 2. Migration done for aliases and networks => return true
  if (
    composeNetwork?.name === params.DNP_PRIVATE_NETWORK_NAME && // Check property name is defined
    composeNetwork?.external && // Check is external network
    gte(
      parseComposeSemver(composeVersion),
      parseComposeSemver(params.MINIMUM_COMPOSE_VERSION)
    ) && // Check version is at least 3.5
    aliases.every(alias => serviceNetwork.aliases?.includes(alias)) // Check every alias has been added
  )
    return true;

  return false; // In other cases return false
}

