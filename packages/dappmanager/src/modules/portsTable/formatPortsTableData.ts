import {
  TcpPortScan,
  PackageContainer,
  UpnpPortMapping,
  PackagePort,
  PortsTable
} from "../../common";
import { getApiStatus } from "./getApiStatus";
import { getMergedStatus } from "./getMergedStatus";
import { getUpnpStatus } from "./getUpnpStatus";
import * as db from "../../db";

/**
 * Returns the necessary data for display the
 * ports table in the UI well formatted
 */
export function formatPortsTableData({
  apiTcpPortsStatus = undefined,
  containers,
  upnpPortMappings,
  portsToOpen
}: {
  apiTcpPortsStatus: TcpPortScan[] | undefined;
  containers: PackageContainer[];
  upnpPortMappings: UpnpPortMapping[];
  portsToOpen: PackagePort[];
}): PortsTable[] {
  const upnpAvailable = db.upnpAvailable.get();

  const packagesPortsContainers = new Map<
    PackagePort,
    PackageContainer | undefined
  >(
    portsToOpen.map(portPackage => [
      portPackage,
      containers.find(
        container =>
          container.ports.find(
            portMapping => portMapping.host === portPackage.portNumber
          ) ||
          container.defaultPorts?.find(
            portMapping => portMapping.host === portPackage.portNumber
          )
      ) || undefined
    ])
  );

  return portsToOpen.map(port => {
    const apiStatus = getApiStatus({ port, apiTcpPortsStatus });
    const upnpStatus = getUpnpStatus({ port, upnpAvailable, upnpPortMappings });
    return {
      port: port.portNumber,
      protocol: port.protocol,
      upnpStatus: upnpStatus,
      apiStatus: apiStatus,
      mergedStatus: getMergedStatus({
        apiStatus,
        upnpStatus,
        protocol: port.protocol
      }),
      serviceName:
        packagesPortsContainers.get({
          portNumber: port.portNumber,
          protocol: port.protocol
        })?.serviceName || "unknown",
      dnpName:
        packagesPortsContainers.get({
          portNumber: port.portNumber,
          protocol: port.protocol
        })?.dnpName || "unknown"
    };
  });
}
