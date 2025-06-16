import { logs } from "@dappnode/logger";
import Dockerode from "dockerode";
import { isEmpty } from "lodash-es";
import { InstalledPackageDataApiReturn } from "@dappnode/types";
import { params } from "@dappnode/params";
import { disconnectConflictingContainerIfAny, docker, dockerComposeUp, findContainerByIP } from "@dappnode/dockerapi";
import { getDockerComposePath, removeCidrSuffix, getPrivateNetworkAliases } from "@dappnode/utils";

export async function connectPkgContainers({
  pkg,
  networkName,
  dappmanagerIp,
  bindIp
}: {
  pkg: InstalledPackageDataApiReturn;
  networkName: string;
  dappmanagerIp: string;
  bindIp: string;
}): Promise<void> {
  const network = docker.getNetwork(networkName);
  for (const container of pkg.containers) {
    const { containerName } = container;
    const aliases = getPrivateNetworkAliases(
      {
        serviceName: container.serviceName,
        dnpName: pkg.dnpName,
        isMainOrMonoservice: container.isMain || pkg.containers.length === 1
      },
      networkName
    );

    // Special handling for bind and dappmanager containers
    const isBindContainer = containerName === params.bindContainerName;
    const isDappmanagerContainer = containerName === params.dappmanagerContainerName;
    if (isBindContainer || isDappmanagerContainer) {
      logs.info(`Connecting special container ${containerName} to network ${network.id} with IP ${bindIp}`);
      await connectPkgContainerWithIp({
        network,
        containerName,
        containerIp: isBindContainer ? bindIp : dappmanagerIp,
        aliases
      });
      continue;
    }

    const connected = await isContainerConnected(containerName, network);
    if (connected) continue;

    await network
      .connect({
        Container: containerName,
        EndpointConfig: { Aliases: aliases }
      })
      .catch((error) => {
        logs.error(`Failed to connect container ${containerName} to network ${network.id}: ${error.message}`);
      });
  }
}

/**
 * Connect a container to a docker network with an IP.
 *
 * - If there are any docker containers connected to the network with that IP
 * then it will disconnect them.
 *
 * - If the container is not running it will restart it.
 *
 * - If the container is already connected to the given network
 * and is connected with the correct IP then will return.
 *
 * - If it is not connected or is connected with the wrong IP
 * then it will connectContainerRetryOnIpUsed function which will
 * try to connect the container with the IP and freeing the IP if
 * needed.
 *
 * @param network dockerode network instance container must be connected to
 * @param containerName containername of the container to be connected to
 * @param containerIp container IP fo the container to be connected with
 */
export async function connectPkgContainerWithIp({
  network,
  containerName,
  containerIp,
  aliases
}: {
  network: Dockerode.Network;
  containerName: string;
  containerIp: string;
  aliases: string[];
}) {
  // check if there are any docker containers connected to the network with that IP different than the container requested
  const conflictingContainerName = (await findContainerByIP(network, containerIp))?.Name;
  if (conflictingContainerName && conflictingContainerName !== containerName)
    await disconnectConflictingContainerIfAny(network, containerIp);

  // check target container is running, otherwise the docker network connect might not take effect
  const targetContainer = docker.getContainer(containerName);
  try {
    // There has been edge cases where docker containers are in an intermedium state with a different docker container name
    // i.e b7903a289091_DAppNodeCore-bind.dnp.dappnode.eth instead of DAppNodeCore-bind.dnp.dappnode.eth
    const containerInfo = await targetContainer.inspect();
    if (!containerInfo.State.Running && containerName !== params.dappmanagerContainerName) {
      logs.warn(`container ${containerName} is not running, restarting it`);
      await targetContainer.restart();
    }
    // TODO: check this ip is good
    const hasContainerRightIp = removeCidrSuffix(containerInfo.NetworkSettings.IPAddress) === containerIp;

    if (hasContainerRightIp) logs.info(`container ${containerName} has right IP and is connected to docker network`);
    else {
      logs.info(`container ${containerName} does not have right IP and/or is not connected to docker network`);
      await connectPkgContainerRetryOnIpUsed({
        network,
        containerName,
        maxAttempts: 20,
        ip: containerIp,
        aliases
      });
    }
  } catch (e) {
    // check if container does not exist 404
    if (containerName === params.bindContainerName && e.statusCode === 404) {
      logs.warn(`container ${params.bindContainerName} not found and it might be in an intermedium state`);
      // the container might be in intermedium state with different name
      // TODO: what if there is a docker container already using this IP.
      // This would be extremley dangerous once the migration to the private ip range is done
      // and less ips are available.
      logs.info(`recreating container ${containerName} with compose up`);
      await dockerComposeUp(getDockerComposePath(params.bindDnpName, true), {
        forceRecreate: true
      });
    } else throw e;
  }
}

/**
 * Connect a container to a network, handling IP conflicts with retries.
 *
 * @param networkName The name of the network.
 * @param containerName The name or ID of the container.
 * @param endpointConfig Configuration options for the network connection.
 * @param maxAttempts The maximum number of attempts to connect the container.
 */
async function connectPkgContainerRetryOnIpUsed({
  network,
  containerName,
  maxAttempts,
  ip,
  aliases
}: {
  network: Dockerode.Network;
  containerName: string;
  maxAttempts: number;
  ip: string;
  aliases: string[];
}): Promise<void> {
  // prevent function from running too many times
  if (maxAttempts > 100) maxAttempts = 100;
  if (maxAttempts < 1) maxAttempts = 1;
  let attemptCount = 0;
  const networkOptions = {
    Container: containerName,
    EndpointConfig: {
      IPAMConfig: {
        IPv4Address: ip
      },
      Aliases: aliases
    }
  };

  while (attemptCount < maxAttempts) {
    try {
      await network.connect(networkOptions);
      logs.info(`Successfully connected ${containerName} with ip ${ip} and aliases ${aliases}`);
      // The disconnected containers will be reconnected later (in the IP range migration)
      return;
    } catch (error) {
      if (error.statusCode === 403 && error.message.includes("Address already in use"))
        await disconnectConflictingContainerIfAny(network, ip);
      else if (
        error.statusCode === 403 &&
        // endpoint with name <containerName> already exists in
        error.message.includes("already exists")
      ) {
        // IP is not right, reconnect container with proper IP
        logs.warn(`container ${containerName} already connected to network ${network.id} with wrong IP`);
        await network.disconnect({
          Container: containerName
        });

        // The container will be reconnected in the next iteration
      } else {
        logs.error(error);
        return;
      }
    }
    attemptCount++;
  }
  logs.error(`Failed to connect after ${maxAttempts} attempts due to repeated IP conflicts.`);
}

async function isContainerConnected(containerName: string, network: Dockerode.Network): Promise<boolean> {
  const connectedContainers = ((await network.inspect()) as Dockerode.NetworkInspectInfo).Containers;

  // If no containers info, assume not connected
  if (!connectedContainers || isEmpty(connectedContainers)) return false;
  return Object.values(connectedContainers).some((info) => info.Name === containerName);
}
