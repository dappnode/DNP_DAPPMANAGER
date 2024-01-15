import {
  disconnectConflictingContainerIfAny,
  docker,
  findContainerByIP,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";
import { removeCidrSuffix } from "@dappnode/utils";
import Dockerode from "dockerode";

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
 * @param aliasesIpsMap aliases
 */
export async function connectContainerWithIp({
  network,
  containerName,
  containerIp,
  aliasesIpsMap,
}: {
  network: Dockerode.Network;
  containerName: string;
  containerIp: string;
  aliasesIpsMap: Map<
    string,
    {
      aliases: string[];
      ip: string;
    }
  >;
}) {
  // check if there are any docker containers connected to the network with that IP different than the container requested
  const conflictingContainerName = (
    await findContainerByIP(network, containerIp)
  )?.Name;
  if (conflictingContainerName && conflictingContainerName !== containerName)
    await disconnectConflictingContainerIfAny(network, containerIp);

  // check target container is running, otherwise the docker network connect might not take effect
  const targetContainer = docker.getContainer(containerName);
  const containerInfo = await targetContainer.inspect();
  if (
    !containerInfo.State.Running &&
    containerName !== params.dappmanagerContainerName
  ) {
    logs.warn(`container ${containerName} is not running, restarting it`);
    await targetContainer.restart();
  }

  const hasContainerRightIp =
    removeCidrSuffix(aliasesIpsMap.get(containerName)?.ip || "") ===
    containerIp;

  if (hasContainerRightIp)
    logs.info(
      `container ${containerName} has right IP and is connected to docker network`
    );
  else {
    logs.info(
      `container ${containerName} does not have right IP and/or is not connected to docker network`
    );
    await connectContainerRetryOnIpUsed({
      network,
      containerName,
      maxAttempts: 20,
      ip: containerIp,
      aliasesIpsMap,
    });
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
async function connectContainerRetryOnIpUsed({
  network,
  containerName,
  maxAttempts,
  ip,
  aliasesIpsMap,
}: {
  network: Dockerode.Network;
  containerName: string;
  maxAttempts: number;
  ip: string;
  aliasesIpsMap: Map<
    string,
    {
      aliases: string[];
      ip: string;
    }
  >;
}): Promise<void> {
  // prevent function from running too many times
  if (maxAttempts > 100) maxAttempts = 100;
  if (maxAttempts < 1) maxAttempts = 1;
  const aliases = aliasesIpsMap.get(containerName)?.aliases ?? [];
  let attemptCount = 0;
  const networkOptions = {
    Container: containerName,
    EndpointConfig: {
      IPAMConfig: {
        IPv4Address: ip,
      },
      Aliases: aliases,
    },
  };

  while (attemptCount < maxAttempts) {
    try {
      await network.connect(networkOptions);
      logs.info(
        `Successfully connected ${containerName} with ip ${ip} and aliases ${aliases}`
      );
      // The disconnected containers will be reconnected later (in the IP range migration)
      return;
    } catch (error) {
      if (
        error.statusCode === 403 &&
        error.message.includes("Address already in use")
      )
        await disconnectConflictingContainerIfAny(network, ip);
      else if (
        error.statusCode === 403 &&
        // endpoint with name <containerName> already exists in
        error.message.includes("already exists")
      ) {
        // IP is not right, reconnect container with proper IP
        logs.warn(
          `container ${containerName} already connected to network ${network.id} with wrong IP`
        );

        // TODO: What if this fails?
        await network.disconnect({
          Container: containerName,
        });

        // The container will be reconnected in the next iteration
      } else {
        // TODO: What if we cannot connect dappmanager because of this error?
        logs.error(error);
        return;
      }
    }
    attemptCount++;
  }
  logs.error(
    `Failed to connect after ${maxAttempts} attempts due to repeated IP conflicts.`
  );
}
