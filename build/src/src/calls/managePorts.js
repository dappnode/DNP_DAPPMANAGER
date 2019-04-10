const upnpc = require("modules/upnpc");

/**
 * Open or closes requested ports
 *
 * @param {Object} kwargs: {
 *   action: 'open' or 'close' (string)
 *   ports: array of port objects = [
 *      { number: 30303, type: TCP },
 *      ... ]
 * }
 * @return {Object} A formated success message.
 * result: empty
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

  return {
    message: `${action === "open" ? "Opened" : "Closed"} ports ${ports
      .map(p => `${p.number} ${p.type}`)
      .join(", ")}`,
    logMessage: true,
    userAction: true
  };
};

module.exports = managePorts;
