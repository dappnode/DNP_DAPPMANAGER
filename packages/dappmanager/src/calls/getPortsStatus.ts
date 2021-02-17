import * as db from "../db";
import getPortsToOpen from "../daemons/natRenewal/getPortsToOpen";
import { PortToOpen } from "../types";
import { UpnpPortMapping } from "../modules/upnpc/types";
import { PackageContainer, PortsTable } from "../common";
import { listContainers } from "../modules/docker/list";
import { formatPortsTableData } from "../modules/portsTable/formatPortsTableData";
import { performPortsScan } from "../modules/portsTable/performPortsScan";

/**
 * Returns the current ports status using:
 * - UPnP port mapping
 * - API check ports
 */
export async function getPortsStatus({
  isApiScanEnabled
}: {
  isApiScanEnabled: boolean;
}): Promise<PortsTable[]> {
  // Data available in the dappmanager
  const containers: PackageContainer[] = await listContainers();
  const portsToOpen: PortToOpen[] = getPortsToOpen(containers); // Ports to be opened
  const upnpPortMappings: UpnpPortMapping[] = db.upnpPortMappings.get(); // Ports opened, mapped with UPnP

  // API data: tcp ports status
  const apiTcpPortsStatus = isApiScanEnabled
    ? await performPortsScan({
        publicIp: db.publicIp.get(),
        portsToOpen
      })
    : undefined;

  return formatPortsTableData({
    apiTcpPortsStatus,
    upnpPortMappings,
    portsToOpen
  });
}
