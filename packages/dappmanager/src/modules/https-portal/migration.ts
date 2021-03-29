import params from "../../params";
import { logs } from "../../logs";
import { getPrivateNetworkAlias } from "../../domains";
import {
  dockerComposeUp,
  dockerContainerInspect,
  dockerNetworkConnect,
  dockerNetworkDisconnect
} from "../docker";
import { listContainers } from "../docker/list";
import Dockerode from "dockerode";
import shell from "../../utils/shell";
import * as getPath from "../../utils/getPath";
import { ComposeFileEditor } from "../compose/editor";
import { PackageContainer } from "../../types";
import { parseServiceNetworks } from "../compose/networks";

/** Alias for code succinctness */
const dncoreNetworkName = params.DNP_PRIVATE_NETWORK_NAME;

/**
 * DAPPMANAGER updates from <= v0.2.38 must manually add aliases
 * to all running containers.
 * This will run every single time dappmanager restarts and will list al packages
 * and do docker inspect.
 */
export async function addAliasToRunningContainersMigration(): Promise<void> {
  for (const container of await listContainers()) {
    const containerName = container.containerName;
    const alias = getPrivateNetworkAlias(container);

    try {
      // Info from docker inspect and compose file might be not-syncrhnonyzed
      // So this function must be before the check hasAlias()
      migrateCoreNetworkAndAliasInCompose(container, alias);

      const currentEndpointConfig = await getEndpointConfig(containerName);
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
export function hasAlias(
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

/** Get endpoint config for DNP_PRIVATE_NETWORK_NAME */
async function getEndpointConfig(
  containerName: string
): Promise<Dockerode.NetworkInfo | null> {
  const inspectInfo = await dockerContainerInspect(containerName);
  return inspectInfo.NetworkSettings.Networks[dncoreNetworkName] ?? null;
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

  // 0. Check if network migration has been done

  // 1. Get compose network settings: not needed since will be declared as external
  // const networkConfig = compose.getComposeNetwork(dncoreNetworkNameFromCore);

  // 2. Get compose service network settings
  const composeService = compose.services()[container.serviceName];

  const serviceNetworks = parseServiceNetworks(
    composeService.get().networks || {}
  );

  const serviceNetwork =
    serviceNetworks?.[params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE];

  // 3. Check if migration was done
  const composeNetwork = compose.getComposeNetwork(
    params.DNP_PRIVATE_NETWORK_NAME
  );
  if (
    !serviceNetwork || // serviceNetwork will not exist in composes already migrated
    (composeNetwork?.name === params.DNP_PRIVATE_NETWORK_NAME &&
      composeNetwork?.external &&
      serviceNetwork.aliases?.includes(alias))
  )
    return;

  // 4. Ensure compose file version 3.5
  compose.compose = {
    ...compose.compose,
    version: params.MINIMUM_COMPOSE_VERSION
  };

  // 5. core network migration: network => dncore_network
  composeService.removeNetwork(params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE);
  composeService.addNetwork(
    params.DNP_PRIVATE_NETWORK_NAME,
    { ...serviceNetwork, aliases: [alias] },
    { external: true, name: params.DNP_PRIVATE_NETWORK_NAME } //...networkConfig,
  );

  compose.write();
}
