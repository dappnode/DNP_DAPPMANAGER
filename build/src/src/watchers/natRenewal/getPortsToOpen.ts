import listContainers from "../../modules/listContainers";
// Utils
import { getComposeInstance } from "../../utils/dockerComposeFile";
// Default ports to open in case getPortsToOpen throws
import defaultPortsToOpen from "./defaultPortsToOpen";
import { PackagePort, PortProtocol } from "../../types";
import Logs from "../../logs";
const logs = Logs(module);

/**
 * @returns {array} portsToOpen = [{
 *   protocol: "UDP",
 *   portNumber: 30303
 * }]
 */
export default async function getPortsToOpen() {
  try {
    // Aggreate ports with an object form to prevent duplicates
    const portsToOpen: {
      [portId: string]: PackagePort;
    } = {};
    const addPortToOpen = (protocol: PortProtocol, host: number) => {
      const portNumber = host;
      portsToOpen[`${portNumber}-${protocol}`] = { protocol, portNumber };
    };
    const getPortsToOpen = () => Object.values(portsToOpen);

    /**
     * @param {array} dnpInstalled = [{
     *   packageName: "DAppNodePackage-admin...", {string}
     *   version: "0.1.8", {string}
     *   isDnp: true, {bool}
     *   isCore: false, {bool}
     *   name: "admin.dnp.dappnode.eth", {string}
     *   ports: [{
     *     container: 2222, {number}
     *     host: 3333, {number}
     *     protocol: "tcp" {string}
     *   }, ... ], {array}
     *   running: true, {bool}
     *   portsToClose: [ {portNumber: 30303, protocol: 'UDP'}, ...], {array}
     * }, ... ]
     */
    const dnpList = await listContainers();
    for (const dnp of dnpList) {
      if (dnp.running) {
        // If DNP is running the port mapping is available in the dnpList
        for (const port of dnp.ports || []) {
          if (port.host) {
            addPortToOpen(port.protocol, port.host);
          }
        }
      } else {
        try {
          // If DNP is exited, the port mapping is only available in the docker-compose
          const compose = getComposeInstance(dnp.name);
          const dockerComposePortMappings = compose.getPortMappings();
          for (const port of dockerComposePortMappings || []) {
            // Only consider ports that are mapped (not ephemeral ports)
            if (port.host) addPortToOpen(port.protocol, port.host);
          }
        } catch (e) {
          logs.error(
            `Error getting ports of "${
              (dnp || {}).name
            }" from docker-compose: ${e.stack}`
          );
        }
      }
    }

    return getPortsToOpen();
  } catch (e) {
    logs.error(`Error on getPortsToOpen: ${e.stack}`);
    return defaultPortsToOpen;
  }
}
