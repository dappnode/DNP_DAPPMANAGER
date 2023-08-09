import { ComposeNetwork, ComposeServiceNetwork } from "@dappnode/types";
import Dockerode from "dockerode";
import { uniq } from "lodash-es";
import { PackageContainer } from "@dappnode/common";
import { getPrivateNetworkAlias } from "../../domains.js";
import { logs } from "../../logs.js";
import params from "../../params.js";
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
 * and do docker inspect.
 */
export async function addAliasToRunningContainers(): Promise<void> {
  for (const container of await listContainers()) {
    const containerName = container.containerName;
    const alias = getPrivateNetworkAlias(container);

    try {
      // Info from docker inspect and compose file might be not-syncrhnonyzed
      // So this function must be before the check hasAlias()
      migrateCoreNetworkAndAliasInCompose(container, alias);

      const currentEndpointConfig = await getDnCoreNetworkContainerConfig(containerName);
      if (hasAlias(currentEndpointConfig, alias)) continue;
      const endpointConfig: Partial<Dockerode.NetworkInfo> = {
        ...currentEndpointConfig,
        Aliases: [...(currentEndpointConfig?.Aliases || []), alias]
      };

      // Wifi and VPN containers needs a refresh connect due to its own network configuration
      if (
        container.containerName === params.vpnContainerName ||
        container.containerName === params.wifiContainerName
      ) {
        await shell(`docker rm ${containerName} --force`);
        await dockerComposeUp(
          getPath.dockerCompose(container.dnpName, container.isCore)
        );
      } else {
        await dockerNetworkDisconnect(dncoreNetworkName, containerName);
        await dockerNetworkConnect(
          dncoreNetworkName,
          containerName,
          endpointConfig
        );
      }
      logs.info(`Added alias to running container ${container.containerName}`);
    } catch (e) {
      logs.error(`Error adding alias to container ${containerName}`, e);
    }
  }
}

/** Return true if endpoint config exists and has alias */
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

/**
 * Get compose file network and compose network settings from dncore_network
 * And rewrites the compose with the core network edited
 */
export function migrateCoreNetworkAndAliasInCompose(
  container: PackageContainer,
  alias: string
): void {
  const compose = new ComposeFileEditor(container.dnpName, container.isCore);

  // 1. Get compose network settings
  const composeNetwork = compose.getComposeNetwork(
    params.DNP_PRIVATE_NETWORK_NAME
  );

  // 2. Get compose service network settings
  const composeService = compose.services()[container.serviceName];

  const serviceNetworks = parseServiceNetworks(
    composeService.get().networks || {}
  );

  const serviceNetwork =
    serviceNetworks[params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE] ?? null;

  // 3. Check if migration was done
  if (
    isComposeNetworkAndAliasMigrated(
      composeNetwork,
      serviceNetwork,
      compose.compose.version,
      alias
    )
  )
    return;

  // 4. Ensure compose file version 3.5
  compose.compose = {
    ...compose.compose,
    version: params.MINIMUM_COMPOSE_VERSION
  };

  // 5. Add network and alias
  if (composeNetwork || serviceNetwork)
    // composeNetwork and serviceNetwork might be null and have different values (eitherway it should be the same)
    // Only remove network if exists
    composeService.removeNetwork(params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE);

  const aliases = uniq([...(serviceNetwork?.aliases || []), alias]);
  composeService.addNetwork(
    params.DNP_PRIVATE_NETWORK_NAME,
    { ...serviceNetwork, aliases },
    { external: true, name: params.DNP_PRIVATE_NETWORK_NAME } //...networkConfig,
  );

  compose.write();
}

function isComposeNetworkAndAliasMigrated(
  composeNetwork: ComposeNetwork | null,
  serviceNetwork: ComposeServiceNetwork | null,
  composeVersion: string,
  alias: string
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
    serviceNetwork.aliases?.includes(alias) // Check alias has been added
  )
    return true;
  return false; // In other cases return false
}
