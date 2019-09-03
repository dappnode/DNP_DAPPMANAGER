const dockerList = require("modules/dockerList");
const params = require("params");
const logs = require("logs.js")(module);
// Utils
const getPath = require("utils/getPath");
const parse = require("utils/parse");
// Default ports to open in case getPortsToOpen throws
const defaultPortsToOpen = require("./defaultPortsToOpen");

/**
 * @returns {array} portsToOpen = [{
 *   protocol: "UDP",
 *   portNumber: 30303
 * }]
 */
async function getPortsToOpen() {
  try {
    // Aggreate ports with an object form to prevent duplicates
    const portsToOpen = {};
    const addPort = (type = "tcp", host) => {
      const protocol = type.toUpperCase();
      const portNumber = host;
      portsToOpen[portNumber + protocol] = { protocol, portNumber };
    };
    const getPorts = () => Object.values(portsToOpen);

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
    const dnpList = await dockerList.listContainers();
    for (const dnp of dnpList) {
      if (dnp.running) {
        // If DNP is running the port mapping is available in the dnpList
        for (const port of dnp.ports || []) {
          if (port.host) {
            addPort(port.protocol, port.host);
          }
        }
      } else {
        try {
          // If DNP is exited, the port mapping is only available in the docker-compose
          const dockerComposePath = getPath.dockerCompose(
            dnp.name,
            params,
            dnp.isCore
          );
          /**
           * @param {array} dockerComposePorts = [{
           *   host: "32638",
           *   container: "30303",
           *   protocol: "udp"
           * }]
           */
          const dockerComposePorts = parse.dockerComposePorts(
            dockerComposePath
          );
          for (const port of dockerComposePorts || []) {
            // Only consider ports that are mapped (not ephemeral ports)
            if (port.host) addPort(port.protocol, port.host);
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

    return getPorts();
  } catch (e) {
    logs.error(`Error on getPortsToOpen: ${e.stack}`);
    return defaultPortsToOpen;
  }
}

module.exports = getPortsToOpen;
