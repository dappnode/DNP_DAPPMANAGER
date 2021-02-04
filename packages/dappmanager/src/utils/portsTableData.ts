import {
  InstalledPackageData,
  PackagePort,
  PortScanResponse,
  UpnpPortMapping
} from "../common";

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
      upnpStatus: upnpPortMappings.some(
        upnpPort => parseInt(upnpPort.inPort) === port.portNumber
      )
        ? "open"
        : "closed",
      apiStatus:
        apiTcpPortsStatus.find(apiPort => apiPort.tcpPort === port.portNumber)
          ?.status || "unknown",

      service:
        packages.find(dappnodePackage =>
          dappnodePackage.containers.map(container =>
            container.defaultPorts?.map(
              packagePort => port.portNumber === packagePort.host
            )
          )
        )?.dnpName ||
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

export interface PortsTable {
  port: number;
  protocol: "UDP" | "TCP";
  upnpStatus: "open" | "closed" | "unknown";
  apiStatus: "open" | "closed" | "unknown";
  service: string; // if not found then unknown
}
