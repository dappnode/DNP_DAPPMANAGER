import {
  listPackages,
  dockerNetworkConnectNotThrow,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";
import { connectContainerWithIp } from "./connectContainerWithIp.js";
import Dockerode from "dockerode";

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
}): Promise<void> {
  logs.info(`connecting dappnode containers to docker network ${network.id}`);

  const networkContainersNamesAndIps = await getNetworkContainerNamesAndIps(
    network
  );

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

  const containersNotConnected = await getContainersNamesNotConnected(network);

  if (containersNotConnected.length > 0) {
    logs.info(
      `Reconnecting disconnected containers: ${containersNotConnected}`
    );

    await Promise.all(
      containersNotConnected
        .filter(
          (c) =>
            c !== params.bindContainerName &&
            c !== params.dappmanagerContainerName
        )
        .map(async (c) => {
          const networkConfig: Partial<Dockerode.NetworkInfo> = {
            Aliases: aliasesMap.get(c) ?? [],
          };

          await dockerNetworkConnectNotThrow(network, c, networkConfig);
        })
    );
  }
}

async function getContainersNamesNotConnected(
  network: Dockerode.Network
): Promise<string[]> {
  const containerNames = (await listPackages())
    .map((pkg) => pkg.containers.map((c) => c.containerName))
    .flat();

  const containerNamesAndIps = await getNetworkContainerNamesAndIps(network);

  const containerNamesNotConnected = containerNames.filter(
    (name) => !containerNamesAndIps.some((c) => c.name === name)
  );

  return containerNamesNotConnected;
}

async function getNetworkContainerNamesAndIps(
  network: Dockerode.Network
): Promise<{ name: string; ip: string }[]> {
  const containers = ((await network.inspect()) as Dockerode.NetworkInspectInfo)
    .Containers;

  // Should not happen
  if (!containers) return [];

  return Object.values(containers).map((c) => {
    return {
      name: c.Name,
      ip: c.IPv4Address,
    };
  });
}
