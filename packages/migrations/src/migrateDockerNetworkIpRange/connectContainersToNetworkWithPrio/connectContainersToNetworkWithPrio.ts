import { logs } from "@dappnode/logger";
import { connectContainerWithIp } from "./connectContainerWithIp.js";
import Dockerode from "dockerode";
import { restoreContainersToNetwork } from "../restoreContainersToNetwork/index.js";
import { getNetworkContainerNamesAndIps } from "../getNetworkContainerNamesAndIps.js";

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
  aliasesMap,
  containersToRestart,
  containersToRecreate,
  networkContainersNamesAndIps,
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
  aliasesMap: Map<string, string[]>;
  containersToRestart: string[];
  containersToRecreate: string[];
  networkContainersNamesAndIps: {
    name: string;
    ip: string;
  }[];
}): Promise<void> {
  logs.info(`connecting dappnode containers to docker network ${network.id}`);

  // 1. Connect Dappmanager container
  await connectContainerWithIp({
    network,
    networkContainersNamesAndIps,
    containerName: dappmanagerContainer.name,
    containerIp: dappmanagerContainer.ip,
    aliasesMap,
  });

  // 2. Connect bind container
  await connectContainerWithIp({
    network,
    networkContainersNamesAndIps,
    containerName: bindContainer.name,
    containerIp: bindContainer.ip,
    aliasesMap,
  });

  await restoreContainersToNetwork({
    containersToRestart,
    network,
    aliasesMap,
    networkContainersNamesAndIps,
    containersToRecreate,
  });
}
