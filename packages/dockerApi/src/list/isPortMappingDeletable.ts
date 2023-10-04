import { PortMapping } from "@dappnode/common";

/**
 * Utility to mark a port mapping as deletable in the admin UI
 * Only ports that are known to be added by the user will be deletable
 * @param port
 * @param defaultPorts
 */
export function isPortMappingDeletable(
  port: PortMapping,
  defaultPorts: PortMapping[] | undefined
): boolean {
  return (
    // Assume if no defaultPorts they were empty, so all ports = deletable
    !Array.isArray(defaultPorts) ||
    !defaultPorts.find(
      defaultPort =>
        defaultPort.container == port.container &&
        defaultPort.protocol == port.protocol
    )
  );
}
