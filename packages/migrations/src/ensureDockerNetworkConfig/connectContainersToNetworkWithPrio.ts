import {
  listPackages,
  dockerNetworkConnectNotThrow,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";
import { connectContainerRetryOnIpUsed } from "./connectContainerRetryOnIpUsed.js";
import Dockerode from "dockerode";
import { sanitizeIpFromNetworkInspectContainers } from "./sanitizeIpFromNetworkInspectContainers.js";

/**
 * Connect all dappnode containers to a network giving priority
 * to the dappmanager and bind containers to make sure their IPs
 * are reserved. It will make sure that the reserved IPs are free
 * attemping to connect them.
 *
 * @param networkName "dncore_network" docker network to connect to the docker containers
 * @throw DOES NOT THROW ERROR
 */
export async function connectContainersToNetworkWithPrio({
  network,
  dappmanagerIp,
  bindIp,
  aliasesMap,
}: {
  network: Dockerode.Network;
  dappmanagerIp: string;
  bindIp: string;
  aliasesMap: Map<string, string[]>;
}): Promise<void> {
  logs.info(`connecting dappnode containers to docker network ${network.id}`);

  const networkContainersNamesAndIps = await getNetworkContainerNamesAndIps(network);

  // 1. Connect Dappmanager container
  await ensureContainerHasRightIp({
    network,
    networkContainersNamesAndIps,
    containerName: params.dappmanagerContainerName,
    containerIp: dappmanagerIp,
    aliasesMap,
  });

  // 2. Connect bind container
  await ensureContainerHasRightIp({
    network,
    networkContainersNamesAndIps,
    containerName: params.bindContainerName,
    containerIp: bindIp,
    aliasesMap,
  });

  // 3. Connect rest of containers
  const pkgContainerNames = await getPkgContainerNames();

  // Connecting bind and dappmanager might have disconnected other containers, so we need to get the {name, ip} list again
  const namesAndIpsAfterDisconnection = await getNetworkContainerNamesAndIps(network);

  const containersNotConnected = pkgContainerNames.filter(
    (name) => !namesAndIpsAfterDisconnection.some((c) => c.name === name)
  );

  logs.info(`Reconnecting disconnected containers: ${containersNotConnected}`);

  await Promise.all(
    containersNotConnected
      .filter(
        (c) =>
          c !== params.bindContainerName &&
          c !== params.dappmanagerContainerName
      )
      .map((c) => {
        const networkConfig: Partial<Dockerode.NetworkInfo> = {
          Aliases: aliasesMap.get(c) ?? [],
        };

        dockerNetworkConnectNotThrow(network, c, networkConfig);
      })
  );

}

/**
 * Gets container names from all packages (based on naming and not on docker networking)
 * @returns An array like ["DAppNodeCore-dappmanager.dnp.dappnode.eth", "DAppNodeCore-bind.dnp.dappnode.eth"...] 
 */
async function getPkgContainerNames(): Promise<string[]> {
  const packages = await listPackages();

  return packages.map((pkg) => pkg.containers.map((c) => c.containerName)).flat();
}

async function getNetworkContainerNamesAndIps(network: Dockerode.Network): Promise<{ name: string; ip: string }[]> {
  const networkInfo: Dockerode.NetworkInspectInfo = await network.inspect();
  const containers = networkInfo.Containers;

  // Should not happen
  if (!containers) return [];

  return Object.values(containers).map((c) => {
    return {
      name: c.Name,
      ip: c.IPv4Address,
    };
  });
}

async function ensureContainerHasRightIp({
  network,
  networkContainersNamesAndIps,
  containerName,
  containerIp,
  aliasesMap,
}: {
  network: Dockerode.Network;
  networkContainersNamesAndIps: { name: string; ip: string }[];
  containerName: string;
  containerIp: string;
  aliasesMap: Map<string, string[]>;
}) {
  const hasContainerRightIp = networkContainersNamesAndIps.some(
    (c) =>
      c.name === containerName &&
      sanitizeIpFromNetworkInspectContainers(c.ip) === containerIp
  );

  if (hasContainerRightIp) {
    logs.info(
      `container ${containerName} has right IP and is connected to docker network`
    );
  } else {
    logs.info(
      `container ${containerName} does not have right IP and/or is not connected to docker network`
    );

    await connectContainerRetryOnIpUsed({
      network,
      containerName: params.dappmanagerContainerName,
      maxAttempts: networkContainersNamesAndIps.length,
      ip: containerIp,
      aliasesMap,
    });
  }
}