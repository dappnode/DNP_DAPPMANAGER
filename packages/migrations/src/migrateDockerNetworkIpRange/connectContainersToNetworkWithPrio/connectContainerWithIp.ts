import { logs } from "@dappnode/logger";
import Dockerode from "dockerode";

/**
 * Connect a container to a docker network with an IP.
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
        await disconnectConflictingContainer(network, ip);
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

/**
 * Find a container in a network using a specific IP address.
 * @param networkName The name of the network.
 * @param ipAddress The IP address to search for.
 * @returns The container using the specified IP, if found.
 */
async function findContainerByIP(
  network: Dockerode.Network,
  ipAddress: string
): Promise<Dockerode.NetworkContainer | null> {
  const networkInfo: Dockerode.NetworkInspectInfo = await network.inspect();
  const containers = networkInfo.Containers;
  if (!containers) return null;
  for (const container of Object.values(containers))
    if (removeCidrSuffix(container.IPv4Address) === ipAddress) return container;

  return null;
}

/**
 * Disconnects any container with the specified IP address from the network.
 * @param network dncore_network
 * @param ipAddress 171.33.1.7
 */
async function disconnectConflictingContainer(
  network: Dockerode.Network,
  ipAddress: string
): Promise<void> {
  const conflictingContainer = await findContainerByIP(network, ipAddress);
  if (conflictingContainer) {
    logs.info(
      `address ${ipAddress} already in used by ${conflictingContainer.Name}, freeing it`
    );
    await network.disconnect({ Container: conflictingContainer.Name });
  } else logs.error("Conflicting container not found.");
}

/**
 * Removes the CIDR suffix from an IP address. This function is useful for processing
 * the output of `docker.getNetwork().inspect().Containers` information, where the IP
 * address includes the CIDR suffix.
 *
 * @param ipWithCidr The IP address with CIDR suffix (e.g., '172.30.0.7/16').
 * @returns The IP address without the CIDR suffix (e.g., '172.30.0.7').
 */
function removeCidrSuffix(ipWithCidr: string): string {
  return ipWithCidr.split("/")[0];
}
