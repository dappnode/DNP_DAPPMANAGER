import params from "../../params";
import { logs } from "../../logs";
import { getPrivateNetworkAlias } from "../../domains";
import {
  dockerContainerInspect,
  dockerNetworkConnect,
  dockerNetworkDisconnect
} from "../docker";
import { listContainers } from "../docker/list";
import { addNetworkAliasCompose } from "./utils";

const networkName = params.DNP_PRIVATE_NETWORK_NAME;

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
  if (await hasAlias(params.dappmanagerContainerName, dappmanagerAlias)) {
    return logs.info(`Alias migration already done`);
  }

  // Otherwise check all packages
  for (const container of await listContainers()) {
    const containerName = container.containerName;
    const alias = getPrivateNetworkAlias(container);

    try {
      if (await hasAlias(containerName, alias)) return;

      addNetworkAliasCompose(container, networkName, [alias]);
      await dockerNetworkDisconnect(networkName, containerName);
      await dockerNetworkConnect(networkName, containerName, [alias]);
      logs.info(`Added alias to running container ${container.containerName}`);
    } catch (e) {
      logs.error(`Error adding alias to container ${containerName}`, e);
    }
  }
}

async function hasAlias(
  containerName: string,
  alias: string
): Promise<boolean> {
  const inspectInfo = await dockerContainerInspect(containerName);
  const dncoreNetwork = inspectInfo.NetworkSettings.Networks[networkName];
  return (
    dncoreNetwork.Aliases &&
    Array.isArray(dncoreNetwork.Aliases) &&
    dncoreNetwork.Aliases.includes(alias)
  );
}
