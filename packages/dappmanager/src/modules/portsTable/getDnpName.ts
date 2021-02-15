import { PackagePort, PackageContainer } from "../../common";

/**
 * Service name:
 * 1. First look for matching ports in default ports
 * 2. Secondly look for matching ports in custom ports
 * Returns "unknown" if no match
 */
export function getDnpName({
  port,
  containers
}: {
  port: PackagePort;
  containers: PackageContainer[];
}): string {
  return (
    containers.find(container =>
      container.defaultPorts?.find(
        packagePort => port.portNumber === packagePort.host
      )
    )?.dnpName ||
    containers.find(container =>
      container.ports?.find(packagePort => port.portNumber === packagePort.host)
    )?.dnpName ||
    "unknown"
  );
}
