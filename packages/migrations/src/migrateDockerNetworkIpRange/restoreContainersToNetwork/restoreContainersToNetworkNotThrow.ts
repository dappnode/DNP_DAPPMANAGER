import Dockerode from "dockerode";
import { reconnectDisconnectedContainers } from "./reconnectDisconnectedContainers.js";
import { recreateForceRemovedContainers } from "./recreateForceRemovedContainers.js";
import { restartForceStoppedContainers } from "./restartForceStoppedContainers.js";

export async function restoreContainersToNetworkNotThrow({
  containersToRestart,
  network,
  containersToRecreate,
  aliasesIpsMap,
}: {
  containersToRestart: string[];
  network: Dockerode.Network;
  containersToRecreate: string[];
  aliasesIpsMap: Map<
    string,
    {
      aliases: string[];
      ip: string;
    }
  >;
}): Promise<void> {
  await reconnectDisconnectedContainers(network, aliasesIpsMap);

  await restartForceStoppedContainers(containersToRestart);

  await recreateForceRemovedContainers(containersToRecreate);
}
