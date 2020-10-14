import * as db from "../db";
import { PackagePort } from "../types";
import { UpnpPortMapping } from "../modules/upnpc/types";

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
  const upnpAvailable: boolean = db.upnpAvailable.get();
  const portsToOpen: PackagePort[] = db.portsToOpen.get();
  const upnpPortMappings: UpnpPortMapping[] = db.upnpPortMappings.get();

  return {
    upnpAvailable,
    portsToOpen,
    upnpPortMappings
  };
}
