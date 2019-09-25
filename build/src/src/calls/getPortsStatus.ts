import * as db from "../db";
import { PackagePort, RpcHandlerReturn } from "../types";
import { UpnpPortMapping } from "../modules/upnpc/types";

interface RpcGetPortsStatusReturn extends RpcHandlerReturn {
  result: {
    upnpAvailable: boolean;
    portsToOpen: PackagePort[];
    upnpPortMappings: UpnpPortMapping[];
  };
}

/**
 * Returns the current ports status
 * - portsToOpen is computed from the current installed DNPs, by checking
 *   their port mapping and reading the docker-compose
 * - upnpPortMappings is obtained directly from UPnP
 *
 * @returns {object} {
 *   upnpAvailable: true, {boolean}
 *   portsToOpen: [
 *     { protocol: "UDP", portNumber: 30303 },
 *     ...
 *   ],
 *   upnpPortMappings: [
 *     { protocol: "UDP", exPort: "500", inPort: "500", ip: "192.168.1.42" },
 *     { protocol: "UDP", exPort: "4500", inPort: "4500", ip: "192.168.1.42" },
 *     { protocol: "UDP", exPort: "30303", inPort: "30303", ip: "192.168.1.42" },
 *     { protocol: "TCP", exPort: "30303", inPort: "30303", ip: "192.168.1.42" },
 *     ...
 *   ]
 * }
 */
export default async function getPortsStatus(): Promise<
  RpcGetPortsStatusReturn
> {
  const upnpAvailable: boolean = db.upnpAvailable.get();
  const portsToOpen: PackagePort[] = db.portsToOpen.get();
  const upnpPortMappings: UpnpPortMapping[] = db.upnpPortMappings.get();

  return {
    message: `Got port status`,
    result: {
      upnpAvailable,
      portsToOpen,
      upnpPortMappings
    }
  };
}
