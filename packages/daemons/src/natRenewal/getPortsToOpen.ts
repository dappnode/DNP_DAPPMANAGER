import { PackageContainer, PortToOpen, PortMapping } from "@dappnode/types";
import { logs } from "@dappnode/logger";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { readManifestIfExists } from "@dappnode/utils";
import { listPackages } from "@dappnode/dockerapi";

export async function getPortsToOpen(containers: PackageContainer[]): Promise<PortToOpen[]> {
  // Aggreate ports with an object form to prevent duplicates
  const portsToOpen = new Map<string, PortToOpen>();

  const addPortToOpen = async(port: PortMapping, container: PackageContainer): Promise<void> => {

    const packages = await listPackages();
    const dnp =  packages.find(dnp => dnp.dnpName === container.dnpName);
    if(!dnp) return;
    const manifest = readManifestIfExists(dnp);
    if(manifest && manifest.upnpDisable) {
      if (Array.isArray(manifest.upnpDisable)) {
        if (port.host && manifest.upnpDisable.includes(port.host)) {
          logs.debug(`UPnP disabled for port ${port.host} of ${manifest.name} package`);
          return; // Skip this port if it's in the disable list
        }
      } else if (manifest.upnpDisable === true) {
        // It's a boolean true, skip all ports
        logs.debug(`UPnP disabled for ${manifest.name} package`);
        return;
      }
    }
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
        const compose = new ComposeFileEditor(container.dnpName, container.isCore);

        const service = compose.services()[container.serviceName];
        if (service) {
          // Only consider ports that are mapped (not ephemeral ports)
          for (const port of service.getPortMappings()) addPortToOpen(port, container);
        }
      } catch (e) {
        logs.error(`Error getting ports of ${container.dnpName} from docker-compose`, e);
      }
    }
  }

  return Array.from(portsToOpen.values());
}
