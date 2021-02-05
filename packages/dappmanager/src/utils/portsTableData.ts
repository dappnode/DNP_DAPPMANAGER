import {
  InstalledPackageData,
  PackagePort,
  PortScanResponse,
  PortsTable,
  UpnpPortMapping
} from "../common";
import { upnpAvailable } from "../db";

export function portsTableData({
  apiTcpPortsStatus,
  packages,
  upnpPortMappings,
  portsToOpen
}: {
  apiTcpPortsStatus: PortScanResponse[];
  packages: InstalledPackageData[];
  upnpPortMappings: UpnpPortMapping[];
  portsToOpen: PackagePort[];
}): PortsTable[] {
  // COOKING DATA
  return portsToOpen.map(port => {
    return {
      port: port.portNumber,
      protocol: port.protocol,
      // UPnP:
      // 1.UPnP available AND port open
      // 2.UPnP available AND port closed
      // 3.UPnP not available port unknown
      upnpStatus: !upnpAvailable
        ? "unknown"
        : upnpPortMappings.some(
            upnpPort => parseInt(upnpPort.inPort) === port.portNumber
          )
        ? "open"
        : "closed",
      // API
      // 1.API available AND port open
      // 2.API available AND port closed
      // 3.API not available port unknown
      apiStatus:
        apiTcpPortsStatus.find(apiPort => apiPort.tcpPort === port.portNumber)
          ?.status || "unknown",

      // Service name
      service:
        // 1.Look for matching ports in containers > default ports
        packages.find(dappnodePackage =>
          dappnodePackage.containers.map(container =>
            container.defaultPorts?.map(
              packagePort => port.portNumber === packagePort.host
            )
          )
        )?.dnpName ||
        // 2.Look for matching ports in containers > ports
        packages.find(dappnodePackage =>
          dappnodePackage.containers.map(container =>
            container.ports?.map(
              packagePort => port.portNumber === packagePort.host
            )
          )
        )?.dnpName ||
        "unknown"
    };
  });
}
