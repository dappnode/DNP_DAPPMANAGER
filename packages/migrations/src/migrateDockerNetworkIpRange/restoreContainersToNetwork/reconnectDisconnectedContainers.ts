import {
  dockerNetworkConnectNotThrow,
  listPackages,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import Dockerode from "dockerode";
import { filterContainers } from "./filterContainers.js";

export async function reconnectDisconnectedContainers(
  network: Dockerode.Network,
  aliasesMap: Map<string, string[]>,
  networkContainersNamesAndIps: {
    name: string;
    ip: string;
  }[]
): Promise<void> {
  const containersNotConnected = await getContainersNamesNotConnected(
    networkContainersNamesAndIps
  );

  if (containersNotConnected.length > 0) {
    logs.info(
      `Reconnecting disconnected containers: ${containersNotConnected}`
    );
    await Promise.all(
      filterContainers(containersNotConnected).map(async (c) => {
        const networkConfig: Partial<Dockerode.NetworkInfo> = {
          Aliases: aliasesMap.get(c) ?? [],
        };

        await dockerNetworkConnectNotThrow(network, c, networkConfig);
      })
    );
  }
}

async function getContainersNamesNotConnected(
  networkContainersNamesAndIps: {
    name: string;
    ip: string;
  }[]
): Promise<string[]> {
  const containerNames = (await listPackages())
    .map((pkg) => pkg.containers.map((c) => c.containerName))
    .flat();

  const containerNamesNotConnected = containerNames.filter(
    (name) => !networkContainersNamesAndIps.some((c) => c.name === name)
  );

  return containerNamesNotConnected;
}
