import Dockerode from "dockerode";
import { reconnectDisconnectedContainers } from "./reconnectDisconnectedContainers.js";
import { recreateContainersToRecreate } from "./recreateContainersToRecreate.js";
import { restartContainersToRestart } from "./restartContainersToRestart.js";

export async function restoreContainersToNetwork({
  containersToRestart,
  network,
  aliasesMap,
  networkContainersNamesAndIps,
  containersToRecreate,
}: {
  containersToRestart: string[];
  network: Dockerode.Network;
  aliasesMap: Map<string, string[]>;
  networkContainersNamesAndIps: {
    name: string;
    ip: string;
  }[];
  containersToRecreate: string[];
}): Promise<void> {
  await reconnectDisconnectedContainers(
    network,
    aliasesMap,
    networkContainersNamesAndIps
  );

  await restartContainersToRestart(containersToRestart);

  await recreateContainersToRecreate(containersToRecreate);
}
