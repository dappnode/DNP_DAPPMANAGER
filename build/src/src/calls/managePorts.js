const docker = require('modules/docker');

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
const managePorts = async ({action, ports}) => {
  if (!Array.isArray(ports)) {
    throw Error('kwarg ports must be an array: ' + JSON.stringify(ports));
  }

  let msg;
  for (const port of ports) {
    switch (action) {
      case 'open':
        await docker.openPort(port);
        msg = 'Opened';
        break;
      case 'close':
        await docker.closePort(port);
        msg = 'Closed';
        break;
      default:
        throw Error('Unkown manage ports action: ' + action);
    }
  }

  return {
    message: `${msg} ports ${ports.map((p) => `${p.number} ${p.type}`).join(', ')}`,
    logMessage: true,
    userAction: true,
  };
};

module.exports = managePorts;
