import { TcpPortScan, UpnpPortMapping, PortsTable } from "../../common";
import { getApiStatus } from "./getApiStatus";
import { getMergedStatus } from "./getMergedStatus";
import { getUpnpStatus } from "./getUpnpStatus";
import * as db from "../../db";
import { PortToOpen } from "../../types";

/**
 * Returns the necessary data for display the
 * ports table in the UI well formatted
 */
export function formatPortsTableData({
  apiTcpPortsStatus = undefined,
  upnpPortMappings,
  portsToOpen
}: {
  apiTcpPortsStatus: TcpPortScan[] | undefined;
  upnpPortMappings: UpnpPortMapping[];
  portsToOpen: PortToOpen[];
}): PortsTable[] {
  return portsToOpen.map(port => {
    const apiStatus = getApiStatus({ port, apiTcpPortsStatus });
    const upnpStatus = getUpnpStatus({
      port,
      upnpAvailable: db.upnpAvailable.get(),
      upnpPortMappings
    });
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
      serviceName: port.serviceName,
      dnpName: port.dnpName
    };
  });
}
