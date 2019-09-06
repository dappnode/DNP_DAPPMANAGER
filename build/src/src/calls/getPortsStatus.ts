import * as db from "../db";
import { PackagePort, PortMapping, RpcHandlerReturn } from "../types";

interface RpcGetPortsStatusReturn extends RpcHandlerReturn {
  result: {
    upnpAvailable: boolean;
    portsToOpen: PackagePort[];
    currentPortMappings: PortMapping[];
  };
}

/**
 * Returns the current ports status
 * - portsToOpen is computed from the current installed DNPs, by checking
 *   their port mapping and reading the docker-compose
 * - currentPortMappings is obtained directly from UPnP
 *
 * @returns {object} {
 *   upnpAvailable: true, {boolean}
 *   portsToOpen: [
 *     { protocol: "UDP", portNumber: 30303 },
 *     ...
 *   ],
 *   currentPortMappings: [
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
  const upnpAvailable: boolean = db.get("upnpAvailable");
  const portsToOpen: PackagePort[] = db.get("portsToOpen");
  const currentPortMappings: PortMapping[] = db.get("currentPortMappings");

  return {
    message: `Got port status`,
    result: {
      upnpAvailable,
      portsToOpen,
      currentPortMappings
    }
  };
}
