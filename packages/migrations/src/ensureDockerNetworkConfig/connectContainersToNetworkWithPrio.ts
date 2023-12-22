import {
  listPackages,
  dockerNetworkConnectNotThrow,
  docker,
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
  networkName,
  dappmanagerIp,
  bindIp,
  aliasesMap,
}: {
  networkName: string;
  dappmanagerIp: string;
  bindIp: string;
  aliasesMap: Map<string, string[]>;
}): Promise<void> {
  logs.info(`connecting dappnode containers to docker network ${networkName}`);

  // list packages return pkg data based on naming and not on docker networking
  const containerNames = (await listPackages())
    .map((pkg) => pkg.containers.map((c) => c.containerName))
    .flat();

  const networkContainers = (
    (await docker
      .getNetwork(networkName)
      .inspect()) as Dockerode.NetworkInspectInfo
  ).Containers;
  if (networkContainers) {
    // connect first dappmanager and bind
    const networkContainerNamesAndIps: { name: string; ip: string }[] =
      Object.values(networkContainers).map((c) => {
        return {
          name: c.Name,
          ip: c.IPv4Address,
        };
      });
    const isDappmanagerConnectedWithRightIp = networkContainerNamesAndIps.some(
      (c) =>
        c.name === params.dappmanagerContainerName &&
        sanitizeIpFromNetworkInspectContainers(c.ip) === dappmanagerIp
    );
    if (!isDappmanagerConnectedWithRightIp) {
      logs.info(
        `container ${params.dappmanagerContainerName} does not have right IP and/or is not connected to docker network`
      );
      // dappmanager must resolve to the hardcoded ip to use the ip as fallback ot access UI
      await connectContainerRetryOnIpUsed({
        networkName,
        containerName: params.dappmanagerContainerName,
        maxAttempts: containerNames.length,
        ip: dappmanagerIp,
        aliasesMap,
      });
    }

    const isBindConnectedWithRightIp = networkContainerNamesAndIps.some(
      (c) =>
        c.name === params.bindContainerName &&
        sanitizeIpFromNetworkInspectContainers(c.ip) === bindIp
    );
    if (!isBindConnectedWithRightIp) {
      logs.info(
        `container ${params.bindContainerName} does not have right IP and/or is not connected to docker network`
      );
      // bind must resolve to hardcoded ip cause its used as dns in vpn creds
      await connectContainerRetryOnIpUsed({
        networkName,
        containerName: params.bindContainerName,
        maxAttempts: containerNames.length,
        ip: bindIp,
        aliasesMap,
      });
    }

    // connect rest of containers
    const containersNotConnected = containerNames.filter(
      (name) => !networkContainerNamesAndIps.some((c) => c.name === name)
    );
    logs.info(`containers not connected ${containersNotConnected}`);
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

          dockerNetworkConnectNotThrow(networkName, c, networkConfig);
        })
    );
  }
}
