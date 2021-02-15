import { PackagePort, PackageContainer } from "../../common";

export function getServiceName({
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
    )?.serviceName ||
    containers.find(container =>
      container.ports?.find(packagePort => port.portNumber === packagePort.host)
    )?.serviceName ||
    "unknown"
  );
}
