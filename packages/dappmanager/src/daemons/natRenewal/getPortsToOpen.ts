import { PackageContainer, PortToOpen, PortMapping } from "@dappnode/common";
import { logs } from "../../logs";
import { ComposeFileEditor } from "../../modules/compose/editor";

export default function getPortsToOpen(
  containers: PackageContainer[]
): PortToOpen[] {
  // Aggreate ports with an object form to prevent duplicates
  const portsToOpen = new Map<string, PortToOpen>();
  const addPortToOpen = (
    port: PortMapping,
    container: PackageContainer
  ): void => {
    if (port.host) {
      portsToOpen.set(`${port.host}-${port.protocol}`, {
        protocol: port.protocol,
        portNumber: port.host,
        serviceName: container.serviceName,
        dnpName: container.dnpName
      });
    }
  };

  for (const container of containers) {
    if (container.running) {
      // If a container is running the port mapping is available in listContainers()
      for (const port of container.ports || []) {
        addPortToOpen(port, container);
      }
    } else {
      try {
        // If DNP is exited, the port mapping is only available in the docker-compose
        const compose = new ComposeFileEditor(
          container.dnpName,
          container.isCore
        );

        const service = compose.services()[container.serviceName];
        if (service) {
          // Only consider ports that are mapped (not ephemeral ports)
          for (const port of service.getPortMappings())
            addPortToOpen(port, container);
        }
      } catch (e) {
        logs.error(
          `Error getting ports of ${container.dnpName} from docker-compose`,
          e
        );
      }
    }
  }

  return Array.from(portsToOpen.values());
}
