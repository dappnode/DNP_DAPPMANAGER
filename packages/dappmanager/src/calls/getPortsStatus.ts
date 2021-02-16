import * as db from "../db";
import getPortsToOpen from "../daemons/natRenewal/getPortsToOpen";
import { PackagePort } from "../types";
import { UpnpPortMapping } from "../modules/upnpc/types";
import { PackageContainer, PortsTable } from "../common";
import { listContainers } from "../modules/docker/list";
import { formatPortsTableData } from "../modules/portsTable/formatPortsTableData";
import { performPortsScan } from "../modules/portsTable/performPortsScan";

/**
 * Returns the current ports status
 * - portsToOpen is computed from the current installed DNPs, by checking
 *   their port mapping and reading the docker-compose
 * - upnpPortMappings is obtained directly from UPnP
 */
export async function getPortsStatus({
  apiScanEnabled
}: {
  apiScanEnabled: boolean;
}): Promise<PortsTable[]> {
  // DATA
  const containers: PackageContainer[] = await listContainers();
  const portsToOpen: PackagePort[] = getPortsToOpen(containers); // Ports to be opened
  const upnpPortMappings: UpnpPortMapping[] = db.upnpPortMappings.get(); // Ports opened, mapped with UPnP

  // API
  const apiTcpPortsStatus = apiScanEnabled
    ? await performPortsScan({
        publicIp: db.publicIp.get(),
        portsToOpen
      })
    : undefined;

  return formatPortsTableData({
    apiTcpPortsStatus,
    containers,
    upnpPortMappings,
    portsToOpen
  });
}
