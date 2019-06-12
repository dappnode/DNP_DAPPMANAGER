const upnpc = require("modules/upnpc");

/**
 * Open or closes requested ports
 *
 * @param {string} action: "open" or "close" (string)
 * @param {array} ports: array of port objects
 * ports = [ { portNumber: 30303, protocol: TCP }, ... ]
 */

const managePorts = async ({ action, ports }) => {
  if (!Array.isArray(ports)) {
    throw Error(`kwarg ports must be an array: ${JSON.stringify(ports)}`);
  }

  for (const port of ports) {
    if (action === "open") upnpc.open(port);
    else if (action === "close") upnpc.close(port);
    else throw Error(`Unknown manage ports action: ${action}`);
  }

  // portsString = "30303 TCP, 30303 UDP"
  const portsString = ports
    .map(p => `${p.portNumber} ${p.protocol}`)
    .join(", ");

  return {
    message: `${action === "open" ? "Opened" : "Closed"} ports ${portsString}`,
    logMessage: true,
    userAction: true
  };
};

module.exports = managePorts;
