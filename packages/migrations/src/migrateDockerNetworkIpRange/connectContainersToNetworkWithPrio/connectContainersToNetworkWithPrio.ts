import { logs } from "@dappnode/logger";
import { connectContainerWithIp } from "./connectContainerWithIp.js";
import Dockerode from "dockerode";
import { restoreContainersToNetworkNotThrow } from "../restoreContainersToNetwork/index.js";

/**
 * Connect all dappnode containers to a network giving priority
 * to the dappmanager and bind containers to make sure their IPs
 * are reserved. It will make sure that the reserved IPs are free
 * attemping to connect them.
 *
 * @param network
 * @param dappmanagerIp
 * @param bindIp
 * @param aliasesMap
 */
export async function connectContainersToNetworkWithPrio({
  network,
  dappmanagerContainer,
  bindContainer,
  aliasesIpsMap,
  containersToRestart,
  containersToRecreate,
}: {
  network: Dockerode.Network;
  dappmanagerContainer: {
    name: string;
    ip: string;
  };
  bindContainer: {
    name: string;
    ip: string;
  };
  aliasesIpsMap: Map<
    string,
    {
      aliases: string[];
      ip: string;
    }
  >;
  containersToRestart: string[];
  containersToRecreate: string[];
}): Promise<void> {
  logs.info(`connecting dappnode containers to docker network ${network.id}`);

  // 1. Connect Dappmanager container
  await connectContainerWithIp({
    network,
    containerName: dappmanagerContainer.name,
    containerIp: dappmanagerContainer.ip,
    aliasesIpsMap,
  });

  // 2. Connect bind container
  await connectContainerWithIp({
    network,
    containerName: bindContainer.name,
    containerIp: bindContainer.ip,
    aliasesIpsMap,
  });

  await restoreContainersToNetworkNotThrow({
    containersToRestart,
    network,
    aliasesIpsMap,
    containersToRecreate,
  });
}
