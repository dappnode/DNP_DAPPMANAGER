import Dockerode from "dockerode";
import { logs } from "@dappnode/logger";
import { findContainerByIP } from "./findContainerByIP.js";

/**
 * Disconnects any container with the specified IP address from the network.
 * @param network dncore_network
 * @param ipAddress 171.33.1.7
 * @returns conflictingContainer if any
 */
export async function disconnectConflictingContainerIfAny(
  network: Dockerode.Network,
  ipAddress: string
): Promise<Dockerode.NetworkContainer | null> {
  const conflictingContainer = await findContainerByIP(network, ipAddress);
  if (conflictingContainer) {
    logs.info(`address ${ipAddress} already in used by ${conflictingContainer.Name}, freeing it`);
    await network.disconnect({ Container: conflictingContainer.Name });
  } else logs.info("Conflicting container not found.");
  return conflictingContainer;
}
