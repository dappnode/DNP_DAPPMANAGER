import {
  dockerNetworkConnectNotThrow,
  listPackages,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import Dockerode from "dockerode";
import { excludeDappmanagerAndBind } from "./excludeDappmanagerAndBind.js";

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
    aliasesIpsMap
  );

  if (containersNotConnected.length > 0) {
    logs.info(
      `Reconnecting disconnected containers: ${containersNotConnected}`
    );
    await Promise.all(
      excludeDappmanagerAndBind(containersNotConnected).map(async (c) => {
        const networkConfig: Partial<Dockerode.NetworkInfo> = {
          Aliases: aliasesIpsMap.get(c) ?? [],
        };

        await dockerNetworkConnectNotThrow(network, c, networkConfig);
      })
    );
  }
}

async function getContainersNamesNotConnected(
  aliasesIpsMap: Map<
    string,
    {
      aliases: string[];
      ip: string;
    }
  >
): Promise<string[]> {
  const containerNames = (await listPackages())
    .map((pkg) => pkg.containers.map((c) => c.containerName))
    .flat();

  // return container names not connected
  return containerNames.filter(
    (name) => ![...aliasesIpsMap.keys()].some((cn) => cn === name)
  );
}
