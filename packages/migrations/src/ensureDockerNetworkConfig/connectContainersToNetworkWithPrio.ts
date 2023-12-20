import {
  listPackages,
  dockerNetworkConnectNotThrow,
  docker,
  dockerNetworkDisconnect,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";
import Dockerode from "dockerode";

const dappmanagerIp = params.DAPPMANAGER_IP;
const bindIp = params.BIND_IP;

/**
 * Connect all dappnode containers to a network giving priority
 * to the dappmanager and bind containers to make sure their IPs
 * are reserved. It will make sure that the reserved IPs are free
 * attemping to connect them.
 *
 * @param networkName "dncore_network" docker network to connect to the docker containers
 */
export async function connectContainersToNetworkWithPrio(
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
    if (containerUsingDappmanagerIp) {
      logs.info(
        `the container ${containerUsingDappmanagerIp} is using dappmanager IP ${dappmanagerIp}, disconnecting it`
      );
      await dockerNetworkDisconnect(
        networkName,
        containerUsingDappmanagerIp.Name
      );
      await dockerNetworkConnectNotThrow(
        networkName,
        containerUsingDappmanagerIp.Name
      );
    }
    const containerUsingBindIp = Object.values(containers).find(
      (c) => c.Name !== bindContainerName && c.IPv4Address === bindIp
    );
    if (containerUsingBindIp) {
      logs.info(
        `the container ${containerUsingBindIp} is using dappmanager IP ${bindIp}, disconnecting it`
      );
      await dockerNetworkDisconnect(networkName, containerUsingBindIp.Name);
      await dockerNetworkConnectNotThrow(
        networkName,
        containerUsingBindIp.Name
      );
    }
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
