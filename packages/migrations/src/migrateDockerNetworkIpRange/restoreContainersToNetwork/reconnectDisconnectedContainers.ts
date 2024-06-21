import {
  dockerNetworkConnectNotThrow,
  listPackages,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import Dockerode from "dockerode";
import { excludeDappmanagerAndBind } from "./excludeDappmanagerAndBind.js";
import { isEmpty } from "lodash-es";

export async function reconnectDisconnectedContainers(
  network: Dockerode.Network,
  aliasesIpsMap: Map<
    string,
    {
      aliases: string[];
      ip: string;
    }
  >
): Promise<void> {
  const containersNotConnected = await getContainersNamesNotConnected(
    Array.from(Object.keys(aliasesIpsMap)),
    network
  );

  if (containersNotConnected.length > 0) {
    logs.info(
      `Reconnecting disconnected containers: ${containersNotConnected}`
    );
    await Promise.all(
      excludeDappmanagerAndBind(containersNotConnected).map(async (c) => {
        const networkConfig: Partial<Dockerode.NetworkInfo> = {
          Aliases: aliasesIpsMap.get(c)?.aliases ?? [],
        };

        await dockerNetworkConnectNotThrow(network.id, c, networkConfig);
      })
    );
  }
}

async function getContainersNamesNotConnected(
  containerNames: string[],
  network: Dockerode.Network
): Promise<string[]> {
  const connectedContainers = (
    (await network.inspect()) as Dockerode.NetworkInspectInfo
  ).Containers;
  const containerNamesList = (await listPackages())
    .map((pkg) => pkg.containers.map((c) => c.containerName))
    .flat();

  // push to containerNames  the containers from containerNamesList that are not in containerNames
  containerNamesList.forEach((c) => {
    if (!containerNames.includes(c)) containerNames.push(c);
  });

  // return all the containers from containerNames that are not connected to the network
  if (!connectedContainers || isEmpty(connectedContainers))
    return containerNamesList;

  return containerNames.filter(
    (c) => !Object.values(connectedContainers).find((cc) => cc.Name === c)
  );
}
