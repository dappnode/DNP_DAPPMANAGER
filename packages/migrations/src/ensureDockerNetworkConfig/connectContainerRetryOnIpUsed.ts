import { docker } from "@dappnode/dockerapi";
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
  networkName,
  containerName,
  maxAttempts,
  ip,
  aliasesMap,
}: {
  networkName: string;
  containerName: string;
  maxAttempts: number;
  ip: string;
  aliasesMap: Map<string, string[]>;
}): Promise<void> {
  // prevent function from running too many times
  if (maxAttempts > 100) maxAttempts = 100;

  const network = docker.getNetwork(networkName);
  let attemptCount = 0;
  const disconnectedContainers: Dockerode.NetworkContainer[] = [];

  while (attemptCount < maxAttempts) {
    try {
      const aliases = aliasesMap.get(containerName) ?? [];
      await network.connect({
        Container: containerName,
        EndpointConfig: {
          IPAMConfig: {
            IPv4Address: ip,
          },
          Aliases: aliases,
        },
      });
      logs.info(
        `Successfully connected ${containerName} with ip ${ip} and aliases ${aliases}`
      );
      // If any container was disconnected, reconnect it
      if (disconnectedContainers.length > 0)
        for (const dc of disconnectedContainers)
          await network
            .connect({
              Container: dc.Name,
              EndpointConfig: {
                Aliases: aliasesMap.get(dc.Name) ?? [],
              },
            })
            // bypass error
            .catch((e) => logs.error(`error connecting ${dc.Name}: ${e}`));

      return; // Connection successful, exit the function
    } catch (error) {
      if (
        error.statusCode === 403 &&
        error.message.includes("Address already in use")
      ) {
        // Error: (HTTP code 403) unexpected - Address already in use
        const conflictingContainer = await findContainerWithIP(networkName, ip);
        if (conflictingContainer) {
          logs.info(
            `address ${ip} already in used by ${conflictingContainer.Name}, freeing it`
          );
          disconnectedContainers.push(conflictingContainer);
          await network.disconnect({ Container: conflictingContainer.Name });
        } else {
          logs.error("Conflicting container not found.");
          return;
        }
      } else {
        logs.error(error);
        return;
      }
    }
    attemptCount++;
  }
  logs.error(
    `Failed to connect after ${maxAttempts} attempts due to repeated IP conflicts.`
  );
  return;
}

/**
 * Find a container in a network using a specific IP address.
 * @param networkName The name of the network.
 * @param ipAddress The IP address to search for.
 * @returns The container using the specified IP, if found.
 */
async function findContainerWithIP(
  networkName: string,
  ipAddress: string
): Promise<Dockerode.NetworkContainer | null> {
  const network = docker.getNetwork(networkName);
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
