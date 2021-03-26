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
import { addNetworkAliasCompose, migrateCoreNetworkInCompose } from "./utils";
import Dockerode from "dockerode";
import shell from "../../utils/shell";
import * as getPath from "../../utils/getPath";

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
      const currentEndpointConfig = await getEndpointConfig(containerName);
      if (hasAlias(currentEndpointConfig, alias)) continue;
      const endpointConfig: Partial<Dockerode.NetworkInfo> = {
        ...currentEndpointConfig,
        Aliases: [...(currentEndpointConfig?.Aliases || []), alias]
      };

      migrateCoreNetworkInCompose(container);
      addNetworkAliasCompose(container, dncoreNetworkName, [alias]);

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
