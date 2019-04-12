const upnpc = require("modules/upnpc");

/**
 * Open or closes requested ports
 *
 * @param {string} action: "open" or "close" (string)
 * @param {array} ports: array of port objects
 * ports = [ { number: 30303, type: TCP }, ... ]
 */
const managePorts = async ({ action, ports }) => {
  if (!Array.isArray(ports)) {
    throw Error(`kwarg ports must be an array: ${JSON.stringify(ports)}`);
  }

  for (const port of ports) {
    if (action === "open") upnpc.open(port);
    else if (action === "close") upnpc.close(port);
    else throw Error(`Unkown manage ports action: ${action}`);
  }

  // portsString = "30303 TCP, 30303 UDP"
  const portsString = ports.map(p => `${p.number} ${p.type}`).join(", ");

  return {
    message: `${action === "open" ? "Opened" : "Closed"} ports ${portsString}`,
    logMessage: true,
    userAction: true
  };
};

module.exports = managePorts;
