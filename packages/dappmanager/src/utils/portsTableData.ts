import {
  InstalledPackageData,
  PackagePort,
  PortsTable,
  TcpPortScan,
  UpnpPortMapping
} from "../common";
import * as db from "../db";

/**
 * Returns the necessary data for display the
 * ports table in the UI well formatted
 */
export function portsTableData({
  apiTcpPortsStatus,
  packages,
  upnpPortMappings,
  portsToOpen
}: {
  apiTcpPortsStatus: TcpPortScan[];
  packages: InstalledPackageData[];
  upnpPortMappings: UpnpPortMapping[];
  portsToOpen: PackagePort[];
}): PortsTable[] {
  const upnpAvailable = db.upnpAvailable.get();

  // COOKING DATA
  return portsToOpen.map(port => {
    return {
      port: port.portNumber,
      protocol: port.protocol,
      upnpStatus: getUpnpStatus({ port, upnpAvailable, upnpPortMappings }),
      apiStatus: getApiStatus({ port, apiTcpPortsStatus }),
      service: getServiceName({ port, packages })
    };
  });
}

// UTILS

/**
 * UPnP:
 * 1.UPnP available AND port open => "open"
 * 2.UPnP available AND port closed => "closed"
 * 3.UPnP not available => "unknown"
 */
function getUpnpStatus({
  port,
  upnpAvailable,
  upnpPortMappings
}: {
  port: PackagePort;
  upnpAvailable: boolean;
  upnpPortMappings: UpnpPortMapping[];
}): "open" | "closed" | "unknown" {
  return !upnpAvailable
    ? "unknown"
    : upnpPortMappings.some(
        upnpPort => parseInt(upnpPort.inPort) === port.portNumber
      )
    ? "open"
    : "closed";
}

/**
 * API
 * 1.API available AND port open => "open"
 * 2.API available AND port closed => "closed"
 * 3.API available AND port error => "error"
 * 4.API not available OR port not found => "unknown"
 */
function getApiStatus({
  port,
  apiTcpPortsStatus
}: {
  port: PackagePort;
  apiTcpPortsStatus: TcpPortScan[];
}): "open" | "closed" | "unknown" | "error" {
  return (
    apiTcpPortsStatus.find(apiPort => apiPort.port === port.portNumber)
      ?.status || "unknown"
  );
}

/**
 * Service name:
 * 1. First look for matching ports in default ports
 * 2. Secondly look for matching ports in custom ports
 * Returns "unknown" if no match
 */
function getServiceName({
  port,
  packages
}: {
  port: PackagePort;
  packages: InstalledPackageData[];
}): string {
  return (
    packages.find(dappnodePackage =>
      dappnodePackage.containers.find(container =>
        container.defaultPorts?.find(
          packagePort => port.portNumber === packagePort.host
        )
      )
    )?.dnpName ||
    packages.find(dappnodePackage =>
      dappnodePackage.containers.find(container =>
        container.ports?.find(
          packagePort => port.portNumber === packagePort.host
        )
      )
    )?.dnpName ||
    "unknown"
  );
}
