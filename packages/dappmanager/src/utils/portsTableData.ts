import {
  PackageContainer,
  PackagePort,
  PortsTable,
  TcpPortScan,
  UpnpPortMapping
} from "../common";
import * as db from "../db";
import { getApiStatus } from "../modules/portsTable/getApiStatus";
import { getMergedStatus } from "../modules/portsTable/getMergedStatus";
import { getDnpName } from "../modules/portsTable/getDnpName";
import { getUpnpStatus } from "../modules/portsTable/getUpnpStatus";
import { getServiceName } from "../modules/portsTable/getServiceName";

/**
 * Returns the necessary data for display the
 * ports table in the UI well formatted
 */
export function portsTableData({
  apiTcpPortsStatus,
  containers,
  upnpPortMappings,
  portsToOpen
}: {
  apiTcpPortsStatus: TcpPortScan[];
  containers: PackageContainer[];
  upnpPortMappings: UpnpPortMapping[];
  portsToOpen: PackagePort[];
}): PortsTable[] {
  const upnpAvailable = db.upnpAvailable.get();

  // COOKING DATA
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
      serviceName: getServiceName({ port, containers }),
      dnpName: getDnpName({ port, containers })
    };
  });
}
