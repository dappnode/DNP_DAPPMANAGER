import { removeCidrSuffix } from "@dappnode/utils";
import Dockerode from "dockerode";

/**
 * Find a container in a network using a specific IP address.
 * @param networkName The name of the network.
 * @param ipAddress The IP address to search for.
 * @returns The container using the specified IP, if found.
 */
export async function findContainerByIP(
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
