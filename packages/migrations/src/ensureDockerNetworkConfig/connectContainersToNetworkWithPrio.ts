import {
  listPackages,
  dockerNetworkConnectNotThrow,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";
import { connectContaierRetryOnIpInUsed } from "./connectContaierRetryOnIpInUsed.js";

/**
 * Connect all dappnode containers to a network giving priority
 * to the dappmanager and bind containers to make sure their IPs
 * are reserved. It will make sure that the reserved IPs are free
 * attemping to connect them.
 *
 * @param networkName "dncore_network" docker network to connect to the docker containers
 */
export async function connectContainersToNetworkWithPrio({
  networkName,
  dappmanagerIp,
  bindIp,
}: {
  networkName: string;
  dappmanagerIp: string;
  bindIp: string;
}): Promise<void> {
  logs.info(`connecting dappnode containers to docker network ${networkName}`);

  // list packages return pkg data based on naming and not on docker networking
  const containerNames = (await listPackages())
    .map((pkg) => pkg.containers.map((c) => c.containerName))
    .flat();

  const { dappmanagerContainerName, bindContainerName } =
    getDappmanagerAndBindContainerNames(containerNames);

  // connect first dappmanager and bind
  // dappmanager must resolve to the hardcoded ip to use the ip as fallback ot access UI
  await connectContaierRetryOnIpInUsed({
    networkName,
    containerName: dappmanagerContainerName,
    maxAttempts: containerNames.length,
    ip: dappmanagerIp,
  });
  // bind must resolve to hardcoded ip cause its used as dns in vpn creds
  await connectContaierRetryOnIpInUsed({
    networkName,
    containerName: bindContainerName,
    maxAttempts: containerNames.length,
    ip: bindIp,
  });
  // connect rest of containers
  await Promise.all(
    containerNames
      .filter((c) => c !== bindContainerName && c !== dappmanagerContainerName)
      .map((c) => dockerNetworkConnectNotThrow(networkName, c))
  );
}

export function getDappmanagerAndBindContainerNames(containerNames: string[]): {
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
