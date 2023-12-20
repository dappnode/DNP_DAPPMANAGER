import {
  docker,
  listPackages,
  dockerNetworkConnectNotThrow,
  dockerNetworkDisconnect,
  disconnectAllContainersFromNetwork,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";
import Dockerode from "dockerode";

const dncoreNetworkName = params.DOCKER_PRIVATE_NETWORK_NAME;
const dncoreNetworkSubnet = params.DOCKER_NETWORK_SUBNET;
const dappmanagerIp = params.DAPPMANAGER_IP;
const bindIp = params.BIND_IP;

// TODO: make sure hardcoded ips are CORRECT: dappmanager and bind
// TODO: publish core packages without hardcoded IPs??

/**
 * Ensures the docker network defined has the following config:
 * - docker network name: "dncore_network"
 * - docker network subnet: "172.33.0.0/16"
 * - dappmanager container has assigned ip: "172.33.1.7"
 * - bind container has assigned ip: "172.33.1.2"
 * - All docker containers prefixed with "DAppnNodeCore-" || "DAppnodePackage-" are connected to it
 * - dappmanager and bind
 */
export async function ensureDockerNetworkConfig(): Promise<void> {
  const dncoreNetwork = docker.getNetwork(dncoreNetworkName);

  try {
    // make sure docker network exists
    const dncoreNetworkInspect: Dockerode.NetworkInspectInfo =
      await dncoreNetwork.inspect();

    logs.info(`docker network ${dncoreNetwork.id} exists`);

    const dncoreNetworkIpamConfig = dncoreNetworkInspect.IPAM?.Config;
    // check network config exists
    if (dncoreNetworkIpamConfig && "Subnet" in dncoreNetworkIpamConfig[0]) {
      // validate ip rage
      if (dncoreNetworkIpamConfig[0].Subnet !== dncoreNetworkSubnet) {
        // IMPORTANT: this is the loop that must be entered when migrating IP range
        // invalid ip range
        logs.info(
          `docker network ${dncoreNetworkName} has invalid subnet ${dncoreNetworkSubnet}, migrating`
        );
        // disconnect all the containers
        logs.info(`disconnecting all containers from ${dncoreNetworkName}`);
        await disconnectAllContainersFromNetwork(dncoreNetworkName);
        // delete network with invalid ip range
        logs.info(`removing docker network ${dncoreNetworkName}`);
        await dncoreNetwork.remove();
        // create network with valid range
        logs.info(
          `creating docker networtk ${dncoreNetworkName} with valid ip range`
        );
        await docker.createNetwork({
          Name: dncoreNetworkName,
          Driver: "bridge",
          IPAM: {
            Driver: "default",
            Config: [
              {
                Subnet: dncoreNetworkSubnet,
              },
            ],
          },
        });
      } else {
        // IMPORTANT: this is the loop that must be entered if not migration
        // valid ip range
        logs.info(
          `docker network ${dncoreNetworkName} has valid subnet ${dncoreNetworkSubnet}`
        );
      }
    } else {
      logs.error(
        `docker network ${dncoreNetworkName} does not have network config`
      );
      // Disconnect all the containers
      await disconnectAllContainersFromNetwork(dncoreNetworkName);
      // delete network
      await dncoreNetwork.remove();
      // create network again with valid range
      await docker.createNetwork({
        Name: dncoreNetworkName,
        Driver: "bridge",
        IPAM: {
          Driver: "default",
          Config: [
            {
              Subnet: dncoreNetworkSubnet,
            },
          ],
        },
      });
    }

    // connect all containers
    await connectContainersToNetworkWithPrio(dncoreNetworkName);
  } catch (e) {
    // Error: (HTTP code 404) no such network - network dncore_network not found
    if (e.statusCode === 404) {
      try {
        // dncore_network does not exist create it
        logs.warn(
          `docker network ${dncoreNetworkName} not found, creating it...`
        );
        await docker.createNetwork({
          Name: dncoreNetworkName,
          Driver: "bridge",
          IPAM: {
            Driver: "default",
            Config: [
              {
                Subnet: dncoreNetworkSubnet,
              },
            ],
          },
        });
        // connect all containers
        await connectContainersToNetworkWithPrio(dncoreNetworkName);
      } catch (e) {
        // Error when creating docker network with overlapping address space:
        // Error: (HTTP code 403) unexpected - Pool overlaps with other one on this address space
        if (e.statusCode === 403) {
          logs.warn(`Another docker network already has subnet assigned: ${e}`);
          const dockerNetworks = await docker.listNetworks();
          const dockerNetworkToRemoveName = dockerNetworks.find((n) => {
            const nConfig = n.IPAM?.Config;
            return (
              nConfig &&
              nConfig.length > 0 &&
              "Subnet" in nConfig[0] &&
              nConfig[0].Subnet === dncoreNetworkSubnet
            );
          })?.Name;
          if (!dockerNetworkToRemoveName)
            throw Error(
              `Could not be found the docker network with subnet ${dncoreNetworkSubnet}`
            );
          logs.warn(`docker network to remove: ${dockerNetworkToRemoveName}`);
          // disconnect containers from network
          await disconnectAllContainersFromNetwork(dockerNetworkToRemoveName);
          // remove conflictive network
          await docker.getNetwork(dockerNetworkToRemoveName).remove();
          // try to create docker network again
          await docker.createNetwork({
            Name: dncoreNetworkName,
            Driver: "bridge",
            IPAM: {
              Driver: "default",
              Config: [
                {
                  Subnet: dncoreNetworkSubnet,
                },
              ],
            },
          });
          // connect all containers
          await connectContainersToNetworkWithPrio(dncoreNetworkName);
        } else throw e;
      }
    } else throw e;
  }
}

/**
 * Connect all dappnode containers to a network giving priority
 * to the dappmanager and bind containers to make sure their IPs
 * are reserved. It will make sure that the reserved IPs are free
 * attemping to connect them.
 *
 * @param networkName "dncore_network" docker network to connect to the docker containers
 * @param containerNames [] docker container names, it should be the dappnode container names
 */
async function connectContainersToNetworkWithPrio(
  networkName: string
): Promise<void> {
  logs.info(`connecting dappnode containers to docker network ${networkName}`);

  // list packages return pkg data based on naming and not on docker networking
  const containerNames = (await listPackages())
    .map((pkg) => pkg.containers.map((c) => c.containerName))
    .flat();

  const { dappmanagerContainerName, bindContainerName } =
    getDappmanagerAndBindContainerNames(containerNames);

  await ensureDappmanagerAndBindIpsAreFree({
    networkName,
    dappmanagerContainerName,
    bindContainerName,
    dappmanagerIp,
    bindIp,
  });

  // connect first dappmanager and bind
  // dappmanager must resolve to the hardcoded ip to use the ip as fallback ot access UI
  await dockerNetworkConnectNotThrow(networkName, dappmanagerContainerName, {
    IPAMConfig: {
      IPv4Address: dappmanagerIp,
    },
  });
  // bind must resolve to hardcoded ip cause its used as dns in vpn creds
  await dockerNetworkConnectNotThrow(networkName, bindContainerName, {
    IPAMConfig: {
      IPv4Address: bindIp,
    },
  });
  // connect rest of containers
  await Promise.all(
    containerNames
      .filter((c) => c !== bindContainerName && c !== dappmanagerContainerName)
      .map((c) => dockerNetworkConnectNotThrow(networkName, c))
  );
}

async function ensureDappmanagerAndBindIpsAreFree({
  networkName,
  dappmanagerContainerName,
  bindContainerName,
  dappmanagerIp,
  bindIp,
}: {
  networkName: string;
  dappmanagerContainerName: string;
  bindContainerName: string;
  dappmanagerIp: string;
  bindIp: string;
}): Promise<void> {
  const containers = (
    (await docker
      .getNetwork(networkName)
      .inspect()) as Dockerode.NetworkInspectInfo
  ).Containers;
  if (containers) {
    const containerUsingDappmanagerIp = Object.values(containers).find(
      (c) =>
        c.Name !== dappmanagerContainerName && c.IPv4Address === dappmanagerIp
    );
    if (containerUsingDappmanagerIp)
      await dockerNetworkDisconnect(
        networkName,
        containerUsingDappmanagerIp.Name
      );
    const containerUsingBindIp = Object.values(containers).find(
      (c) => c.Name !== bindContainerName && c.IPv4Address === bindIp
    );
    if (containerUsingBindIp)
      await dockerNetworkDisconnect(networkName, containerUsingBindIp.Name);
  }
}

function getDappmanagerAndBindContainerNames(containerNames: string[]): {
  dappmanagerContainerName: string;
  bindContainerName: string;
} {
  const dappmanagerContainerName = containerNames.find(
    (c) => c === params.dappmanagerContainerName
  );
  if (!dappmanagerContainerName)
    throw Error("dappmanager container could not be found");

  const bindContainerName = containerNames.find(
    (c) => c === params.bindContainerName
  );
  if (!bindContainerName) throw Error("bind container could not be found");

  return {
    dappmanagerContainerName,
    bindContainerName,
  };
}
