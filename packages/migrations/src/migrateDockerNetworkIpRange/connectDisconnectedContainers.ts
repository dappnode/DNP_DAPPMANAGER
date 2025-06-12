import { dockerNetworkConnectNotThrow } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import Dockerode from "dockerode";
import { isEmpty } from "lodash-es";
import { InstalledPackageDataApiReturn } from "@dappnode/types";
import { params } from "@dappnode/params";
import { getPrivateNetworkAliases } from "@dappnode/utils";

export async function connectDisconnectedContainers(
  pkg: InstalledPackageDataApiReturn,
  network: Dockerode.Network
): Promise<void> {
  for (const container of pkg.containers) {
    const name = container.containerName;
    // skip dappmanager and bind
    if ([params.bindContainerName, params.dappmanagerContainerName].includes(name)) continue;
    const connected = await isContainerConnected(name, network);
    if (!connected) {
      logs.info(`Reconnecting container ${name} to network ${network.id}`);
      const networkConfig: Partial<Dockerode.NetworkInfo> = {
        Aliases: getPrivateNetworkAliases({
          serviceName: container.serviceName,
          dnpName: pkg.dnpName,
          isMainOrMonoservice: false
        })
      };
      await dockerNetworkConnectNotThrow(network.id, name, networkConfig);
    }
  }
}

async function isContainerConnected(containerName: string, network: Dockerode.Network): Promise<boolean> {
  const connectedContainers = ((await network.inspect()) as Dockerode.NetworkInspectInfo).Containers;

  // If no containers info, assume not connected
  if (!connectedContainers || isEmpty(connectedContainers)) return false;
  return !Object.values(connectedContainers).some((info) => info.Name === containerName);
}
