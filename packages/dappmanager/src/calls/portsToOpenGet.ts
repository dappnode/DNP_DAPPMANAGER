import getPortsToOpen from "../daemons/natRenewal/getPortsToOpen";
import { listContainers } from "../modules/docker/list/listContainers";
import { PackageContainer, PortToOpen } from "@dappnode/common";

/**
 * Returns ports to be opened
 */
export async function portsToOpenGet(): Promise<PortToOpen[]> {
  const containers: PackageContainer[] = await listContainers();
  return getPortsToOpen(containers); // Ports to be opened
}
