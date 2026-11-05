import { Manifest, PackageContainer, PortToOpen, PortMapping } from "@dappnode/types";
import { logs } from "@dappnode/logger";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { readManifestIfExists } from "@dappnode/utils";

export function getPortsToOpen(containers: PackageContainer[]): PortToOpen[] {
  // Aggregate ports with an object form to prevent duplicates
  const portsToOpen = new Map<string, PortToOpen>();
  const upnpDisableByPackage = new Map<string, Manifest["upnpDisable"]>();

  for (const container of containers) {
    try {
      if (!upnpDisableByPackage.has(container.dnpName)) {
        upnpDisableByPackage.set(container.dnpName, readManifestIfExists(container.dnpName)?.upnpDisable);
      }
      const upnpDisable = upnpDisableByPackage.get(container.dnpName);
      if (upnpDisable === true) {
        logs.debug(`UPnP disabled for ${container.dnpName} package`);
        continue;
      }

      const addPortToOpen = (port: PortMapping): void => {
        if (!port.host) return;
        if (Array.isArray(upnpDisable) && upnpDisable.includes(port.host)) {
          logs.debug(`UPnP disabled for port ${port.host} of ${container.dnpName} package`);
          return;
        }
        portsToOpen.set(`${port.host}-${port.protocol}`, {
          protocol: port.protocol,
          portNumber: port.host,
          serviceName: container.serviceName,
          dnpName: container.dnpName
        });
      };

      if (container.running) {
        // If a container is running the port mapping is available in listContainers()
        for (const port of container.ports || []) addPortToOpen(port);
      } else {
        // If DNP is exited, the port mapping is only available in the docker-compose
        const compose = new ComposeFileEditor(container.dnpName, container.isCore);

        const service = compose.services()[container.serviceName];
        if (service) {
          // Only consider ports that are mapped (not ephemeral ports)
          for (const port of service.getPortMappings()) addPortToOpen(port);
        }
      }
    } catch (e) {
      logs.error(`Error getting ports of ${container.dnpName}`, e);
    }
  }

  return Array.from(portsToOpen.values());
}
