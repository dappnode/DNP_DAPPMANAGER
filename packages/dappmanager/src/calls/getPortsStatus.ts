import * as db from "../db";
import { PackagePort } from "../types";
import { UpnpPortMapping } from "../modules/upnpc/types";
import getPortsToOpen from "../daemons/natRenewal/getPortsToOpen";
import { performPortsScan } from "../utils/performPortsScan";
import { PackageContainer, PortsTable } from "../common";
import { portsTableData } from "../utils/portsTableData";
import { listContainers } from "../modules/docker/list";

/**
 * Returns the current ports status
 * - portsToOpen is computed from the current installed DNPs, by checking
 *   their port mapping and reading the docker-compose
 * - upnpPortMappings is obtained directly from UPnP
 */
export async function getPortsStatus(): Promise<PortsTable[]> {
  // DATA
  const containers: PackageContainer[] = await listContainers();
  const portsToOpen: PackagePort[] = getPortsToOpen(containers); // Ports to be opened
  const upnpPortMappings: UpnpPortMapping[] = db.upnpPortMappings.get(); // Ports opened, mapped with UPnP

  // API
  const tcpPorts = portsToOpen
    .filter(port => port.protocol === "TCP")
    .map(port => port.portNumber.toString())
    .join(",");
  const publicIp = db.publicIp.get();

  const apiTcpPortsStatus = await performPortsScan({
    publicIp,
    tcpPorts
  });

  return portsTableData({
    apiTcpPortsStatus,
    containers,
    upnpPortMappings,
    portsToOpen
  });
}
