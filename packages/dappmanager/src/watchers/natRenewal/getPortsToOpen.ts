import { listContainers } from "../../modules/docker/listContainers";
// Default ports to open in case getPortsToOpen throws
import defaultPortsToOpen from "./defaultPortsToOpen";
import { PackagePort, PortProtocol } from "../../types";
import { logs } from "../../logs";
import { ComposeFileEditor } from "../../modules/compose/editor";

/**
 * @returns {array} portsToOpen = [{
 *   protocol: "UDP",
 *   portNumber: 30303
 * }]
 */
export default async function getPortsToOpen(): Promise<PackagePort[]> {
  try {
    // Aggreate ports with an object form to prevent duplicates
    const portsToOpen: {
      [portId: string]: PackagePort;
    } = {};
    const addPortToOpen = (protocol: PortProtocol, host: number): void => {
      const portNumber = host;
      portsToOpen[`${portNumber}-${protocol}`] = { protocol, portNumber };
    };
    const getPortsToOpen = (): PackagePort[] => Object.values(portsToOpen);

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
      const id = dnp.name;
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
          const compose = new ComposeFileEditor(dnp.name, dnp.isCore);
          const portMappings = compose.service().getPortMappings();
          // Only consider ports that are mapped (not ephemeral ports)
          for (const port of portMappings)
            if (port.host) addPortToOpen(port.protocol, port.host);
        } catch (e) {
          logs.error(`Error getting ports of ${id} from docker-compose`, e);
        }
      }
    }

    return getPortsToOpen();
  } catch (e) {
    logs.error("Error on getPortsToOpen", e);
    return defaultPortsToOpen;
  }
}
