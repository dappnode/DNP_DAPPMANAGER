import * as db from "../db";
import { PackagePort } from "../types";
import { UpnpPortMapping } from "../modules/upnpc/types";
import getPortsToOpen from "../daemons/natRenewal/getPortsToOpen";
import { getPortsScan } from "../utils/getPortsScan";
import { listPackages } from "../modules/docker/list";
import { InstalledPackageData } from "../common";
import { portsTableData } from "../utils/portsTableData";

/**
 * Returns the current ports status
 * - portsToOpen is computed from the current installed DNPs, by checking
 *   their port mapping and reading the docker-compose
 * - upnpPortMappings is obtained directly from UPnP
 */
export async function getPortsStatus(): Promise<{
  upnpAvailable: boolean;
  portsToOpen: PackagePort[];
  upnpPortMappings: UpnpPortMapping[];
}> {
  // DATA
  const upnpAvailable: boolean = db.upnpAvailable.get();
  const portsToOpen: PackagePort[] = await getPortsToOpen(); // Ports to be opened
  const upnpPortMappings: UpnpPortMapping[] = db.upnpPortMappings.get(); // Ports opened, mapped with UpNp
  const packages: InstalledPackageData[] = await listPackages();

  // API
  const tcpPorts = portsToOpen
    .filter(port => port.protocol === "TCP")
    .map(port => port.portNumber.toString());
  const publicIp = db.publicIp.get();

  const apiTcpPortsStatus = await getPortsScan({
    publicIp,
    tcpPorts
  });

  // Data ports table
  const data = portsTableData({
    apiTcpPortsStatus,
    packages,
    upnpPortMappings,
    portsToOpen
  });

  return {
    upnpAvailable,
    portsToOpen,
    upnpPortMappings
  };
}
