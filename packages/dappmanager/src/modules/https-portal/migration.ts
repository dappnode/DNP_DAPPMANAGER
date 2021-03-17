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
import Dockerode from "dockerode";

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
  const dappmanagerNetworkSettings = await getContainerNetworkSettings(
    params.dappmanagerContainerName
  );
  if (await hasAlias(dappmanagerNetworkSettings, dappmanagerAlias)) {
    return logs.info(`Alias migration already done`);
  }

  // Otherwise check all packages
  for (const container of await listContainers()) {
    const containerName = container.containerName;
    const alias = getPrivateNetworkAlias(container);

    try {
      const networkSettingsBefore = await getContainerNetworkSettings(
        containerName
      );
      if (await hasAlias(networkSettingsBefore, alias)) return;

      const networkSettings = addAlias(networkSettingsBefore, alias);
      addNetworkAliasCompose(container, networkName, [alias]);

      await dockerNetworkDisconnect(networkName, containerName);
      await dockerNetworkConnect({
        networkName,
        containerName,
        networkSettings
      });
      logs.info(`Added alias to running container ${container.containerName}`);
    } catch (e) {
      logs.error(`Error adding alias to container ${containerName}`, e);
    }
  }
}

async function hasAlias(
  containerNetworkSettings: Dockerode.NetworkInfo,
  alias: string
): Promise<boolean> {
  return (
    containerNetworkSettings.Aliases &&
    Array.isArray(containerNetworkSettings.Aliases) &&
    containerNetworkSettings.Aliases.includes(alias)
  );
}

function addAlias(
  containerNetworkSettings: Dockerode.NetworkInfo,
  alias: string
): Dockerode.NetworkInfo {
  containerNetworkSettings.Aliases.push(alias);
  return containerNetworkSettings;
}

async function getContainerNetworkSettings(
  containerName: string,
  networkName = "dncore_network"
): Promise<Dockerode.NetworkInfo> {
  const inspectInfo = await dockerContainerInspect(containerName);
  const containerNetworkSettings =
    inspectInfo.NetworkSettings.Networks[networkName];
  if (!containerNetworkSettings) throw Error("Network does not exist");
  return containerNetworkSettings;
}
