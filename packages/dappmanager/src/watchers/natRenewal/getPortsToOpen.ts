import { listContainers } from "../../modules/docker/list";
// Default ports to open in case getPortsToOpen throws
import defaultPortsToOpen from "./defaultPortsToOpen";
import { PackagePort, PortProtocol } from "../../types";
import { logs } from "../../logs";
import { ComposeFileEditor } from "../../modules/compose/editor";

export default async function getPortsToOpen(): Promise<PackagePort[]> {
  try {
    // Aggreate ports with an object form to prevent duplicates
    const portsToOpen: {
      [portId: string]: PackagePort;
    } = {};
    const addPortToOpen = (protocol: PortProtocol, host: number): void => {
      const portNumber = host;
      portsToOpen[`${portNumber}-${protocol}`] = { protocol, portNumber };
    };
    const getPortsToOpen = (): PackagePort[] => Object.values(portsToOpen);

    const containers = await listContainers();
    for (const container of containers) {
      if (container.running) {
        // If a container is running the port mapping is available in listContainers()
        for (const port of container.ports || []) {
          if (port.host) {
            addPortToOpen(port.protocol, port.host);
          }
        }
      } else {
        try {
          // If DNP is exited, the port mapping is only available in the docker-compose
          const compose = new ComposeFileEditor(
            container.dnpName,
            container.isCore
          );
          for (const service of Object.values(compose.services())) {
            // Only consider ports that are mapped (not ephemeral ports)
            for (const port of service.getPortMappings())
              if (port.host) addPortToOpen(port.protocol, port.host);
          }
        } catch (e) {
          logs.error(
            `Error getting ports of ${container.dnpName} from docker-compose`,
            e
          );
        }
      }
    }

    return getPortsToOpen();
  } catch (e) {
    logs.error("Error on getPortsToOpen", e);
    return defaultPortsToOpen;
  }
}
