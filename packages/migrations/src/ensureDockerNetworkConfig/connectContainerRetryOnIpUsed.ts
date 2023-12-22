import { logs } from "@dappnode/logger";
import Dockerode from "dockerode";
import { sanitizeIpFromNetworkInspectContainers } from "./sanitizeIpFromNetworkInspectContainers.js";

/**
 * Connect a container to a network, handling IP conflicts with retries.
 * @param networkName The name of the network.
 * @param containerName The name or ID of the container.
 * @param endpointConfig Configuration options for the network connection.
 * @param maxAttempts The maximum number of attempts to connect the container.
 */
export async function connectContainerRetryOnIpUsed({
  network,
  containerName,
  maxAttempts,
  ip,
  aliasesMap,
}: {
  network: Dockerode.Network;
  containerName: string;
  maxAttempts: number;
  ip: string;
  aliasesMap: Map<string, string[]>;
}): Promise<void> {
  // prevent function from running too many times
  if (maxAttempts > 100) maxAttempts = 100;

  const aliases = aliasesMap.get(containerName) ?? [];

  const networkOptions = {
    Container: containerName,
    EndpointConfig: {
      IPAMConfig: {
        IPv4Address: ip,
      },
      Aliases: aliases,
    },
  };

  let attemptCount = 0;

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
      ) {
        await disconnectConflictingContainer(network, ip);

      } else if (
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
    if (
      sanitizeIpFromNetworkInspectContainers(container.IPv4Address) ===
      ipAddress
    )
      return container;

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
  } else {
    logs.error("Conflicting container not found.");
  }
}