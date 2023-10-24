import { ComposeNetwork, ComposeServiceNetwork } from "@dappnode/types";
import Dockerode from "dockerode";
import { uniq } from "lodash-es";
import { PackageContainer } from "@dappnode/common";
import { getPrivateNetworkAliases } from "@dappnode/utils";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";
import { parseComposeSemver } from "../../utils/sanitizeVersion.js";
import { shell } from "@dappnode/utils";
import {
  ComposeFileEditor,
  parseServiceNetworks
} from "@dappnode/dockercompose";
import {
  dockerComposeUp,
  dockerNetworkReconnect,
  listPackageContainers,
  getDnCoreNetworkContainerConfig
} from "@dappnode/dockerapi";
import { gte, lt } from "semver";
import { getDockerComposePath } from "@dappnode/utils";

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
  const containers = await listPackageContainers();
  await addAliasToGivenContainers(containers);
}

export async function addAliasToGivenContainers(
  containers: PackageContainer[]
): Promise<void> {
  for (const container of containers) {
    try {
      const service = {
        serviceName: container.serviceName,
        dnpName: container.dnpName,
        isMainOrMonoservice: container.isMain ?? false // false if isMain is undefined
      };

      const aliases = getPrivateNetworkAliases(service);

      // Adds aliases to the compose file that generated the container
      migrateCoreNetworkAndAliasInCompose(container, aliases);

      // Adds aliases to the container network
      const currentEndpointConfig = await getDnCoreNetworkContainerConfig(
        container.containerName
      );
      if (!hasAliases(currentEndpointConfig, aliases)) {
        const updatedConfig = updateEndpointConfig(
          currentEndpointConfig,
          aliases
        );
        await updateContainerNetwork(
          dncoreNetworkName,
          container,
          updatedConfig
        );
        logs.info(`aliases ${aliases} added to ${container.containerName}`);
      }
    }
    catch (e) {
      logs.error(`Error adding aliases to ${container.containerName}`, e);
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

  const rawServiceNetworks = compose.services()[
    // eslint-disable-next-line no-unexpected-multiline
    container.serviceName
  ].get().networks;

  if (!rawServiceNetworks) {
    throw Error(`No networks found in ${container.serviceName} service`);
  }

  const serviceNetworks = parseServiceNetworks(rawServiceNetworks);

  const dncoreServiceNetwork = serviceNetworks[params.DNP_PRIVATE_NETWORK_NAME];

  if (!dncoreServiceNetwork) {
    throw Error(
      `No "dncore_network" found in ${container.serviceName} service`
    );
  }

  const currentDncoreNetworkAliases = dncoreServiceNetwork.aliases || [];

  //add new aliases to current aliases set
  const newAliases = uniq([...currentDncoreNetworkAliases, ...aliases]);

  // Gets the network "dncore_network" from the general compose file
  const dncoreComposeNetwork = compose.getComposeNetwork(
    params.DNP_PRIVATE_NETWORK_NAME
  );

  // Return if migration was done, compose is already updated
  if (
    isComposeNetworkAndAliasMigrated(
      dncoreComposeNetwork,
      dncoreServiceNetwork,
      compose.compose.version,
      newAliases
    )
  )
    return;

  // Ensure/update compose file version 3.5
  // check if its lower than 3.5. Docker aliases was introduced in docker compose version 3.5
  if (
    lt(parseComposeSemver(compose.compose.version), parseComposeSemver("3.5"))
  )
    compose.compose = {
      ...compose.compose,
      version: params.MINIMUM_COMPOSE_VERSION
    };

  // Add aliases to service
  compose.services()[
    // eslint-disable-next-line no-unexpected-multiline
    container.serviceName
  ].addNetworkAliases(params.DNP_PRIVATE_NETWORK_NAME, newAliases, dncoreServiceNetwork);
  compose.write();
}

// function isMainServiceOfMultiServicePackage(container: PackageContainer): boolean {
//   const compose = new ComposeFileEditor(container.dnpName, container.isCore);
//   const services = compose.services(); // Invoke the services function
//   if (Object.keys(services).length > 1 && container.isMain) return true;
//   return false;
// }

function updateEndpointConfig(
  currentEndpointConfig: Dockerode.NetworkInfo | null,
  aliases: string[]
) {
  const currentAliases = currentEndpointConfig?.Aliases || [];
  const newAliases = uniq([...currentAliases, ...aliases]);
  return {
    ...currentEndpointConfig,
    Aliases: newAliases
  };
}

async function updateContainerNetwork(
  networkName: string,
  container: PackageContainer,
  endpointConfig: Partial<Dockerode.NetworkInfo>
): Promise<void> {
  const containerName = container.containerName;

  // Wifi and VPN containers need a refresh connect due to their own network configuration
  if (
    containerName === params.vpnContainerName ||
    containerName === params.wifiContainerName
  ) {
    await shell(`docker rm ${containerName} --force`);
    await dockerComposeUp(
      getDockerComposePath(container.dnpName, container.isCore)
    );
  } else {
    await dockerNetworkReconnect(networkName, containerName, endpointConfig);
    logs.info(`Added new alias to ${containerName} in ${networkName} network`);
  }
}

/** Return true if endpoint config exists, has an array of Alisases and it contains all the aliases
 * @param aliases
 * @returns boolean
 */
function hasAliases(
  endpointConfig: Dockerode.NetworkInfo | null,
  aliases: string[]
): boolean {
  return Boolean(
    endpointConfig &&
    endpointConfig.Aliases &&
    Array.isArray(endpointConfig.Aliases) &&
    aliases.every(alias => endpointConfig.Aliases?.includes(alias))
  );
}

/** Return true if docker-compose.yml file has already been updated with aliases, false otherwise.
 * @param aliases
 * @returns boolean
 */
function isComposeNetworkAndAliasMigrated(
  dncoreComposeNetwork: ComposeNetwork | null,
  dncoreServiceNetwork: ComposeServiceNetwork | null,
  composeVersion: string,
  aliases: string[]
): boolean {
  // 1. If dncore_network is NOT defined both for the service we are checking
  // AND in the general compose file, return false. Migration is not already done.
  if (!dncoreComposeNetwork || !dncoreServiceNetwork) return false;

  // 2. Aside from being at least version 3.5, to consider the docker-compose.yml file as migrated, the network defined in the compose file must:
  //    - be external
  //    - have the expected name
  //    - have the expected aliases in each service
  if (
    dncoreComposeNetwork?.name === params.DNP_PRIVATE_NETWORK_NAME && // Check expected name
    dncoreComposeNetwork?.external && // Check is external network
    gte(
      parseComposeSemver(composeVersion),
      parseComposeSemver(params.MINIMUM_COMPOSE_VERSION)
    ) && // Check version is at least 3.5
    aliases.every(alias => dncoreServiceNetwork.aliases?.includes(alias)) // Check every alias is already present
  )
    return true;

  return false; // In other cases return false
}
