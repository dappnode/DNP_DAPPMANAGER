import params from "../../params";
import { logs } from "../../logs";
import { getPrivateNetworkAlias } from "../../domains";
import {
  dockerContainerInspect,
  dockerNetworkConnect,
  dockerNetworkDisconnect
} from "../docker";
import { listContainers } from "../docker/list";
import { addNetworkAliasCompose, migrateCoreNetworkInCompose } from "./utils";
import Dockerode from "dockerode";

/** Alias for code succinctness */
const dncoreNetworkName = params.DNP_PRIVATE_NETWORK_NAME;

/**
 * DAPPMANAGER updates from <= v0.2.38 must manually add aliases
 * to all running containers.
 */
export async function addAliasToRunningContainersMigration(): Promise<void> {
  // Before running all, check DAPPMANAGER
  const dappmanagerAlias = getPrivateNetworkAlias({
    dnpName: params.dappmanagerDnpName,
    serviceName: params.dappmanagerDnpName
  });
  const dappmanagerEndpointConfig = await getEndpointConfig(
    params.dappmanagerContainerName
  );
  if (hasAlias(dappmanagerEndpointConfig, dappmanagerAlias)) {
    return logs.info(`Alias migration already done`);
  }

  // Otherwise check all packages
  for (const container of await listContainers()) {
    const containerName = container.containerName;
    const alias = getPrivateNetworkAlias(container);

    try {
      const currentEndpointConfig = await getEndpointConfig(containerName);
      if (hasAlias(currentEndpointConfig, alias)) return;
      const endpointConfig: Partial<Dockerode.NetworkInfo> = {
        ...currentEndpointConfig,
        Aliases: [...(currentEndpointConfig?.Aliases || []), alias]
      };

      migrateCoreNetworkInCompose(container);
      addNetworkAliasCompose(container, dncoreNetworkName, [alias]);

      await dockerNetworkDisconnect(dncoreNetworkName, containerName);
      await dockerNetworkConnect(
        dncoreNetworkName,
        containerName,
        endpointConfig
      );

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
