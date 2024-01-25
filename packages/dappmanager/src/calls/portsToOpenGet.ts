import { getPortsToOpen } from "@dappnode/daemons";
import { listPackageContainers } from "@dappnode/dockerapi";
import { PackageContainer, PortToOpen } from "@dappnode/types";

/**
 * Returns ports to be opened
 */
export async function portsToOpenGet(): Promise<PortToOpen[]> {
  const containers: PackageContainer[] = await listPackageContainers();
  return getPortsToOpen(containers); // Ports to be opened
}
