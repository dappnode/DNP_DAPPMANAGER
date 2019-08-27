import * as db from "../db";

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
export default async function getPortsStatus() {
  const upnpAvailable = await db.get("upnpAvailable");
  const portsToOpen = await db.get("portsToOpen");
  const currentPortMappings = await db.get("currentPortMappings");

  return {
    message: `Got port status`,
    result: {
      upnpAvailable,
      portsToOpen,
      currentPortMappings
    }
  };
}
