const upnpcCommand = require("./upnpcCommand");
const validateKwargs = require("./validateKwargs");
const parseCloseOutput = require("./parseCloseOutput");

/**
 * Opens port = maps requested port to host
 * Actual command example:
 *   docker run --rm --net=host ${IMAGE} upnpc -e DAppNode -d 500 UDP
 *
 * @param {Object} kwargs: {
 *   protocol: 'TCP',
 *   portNumber: '3000'
 * }
 * @return {*}
 */
async function close({ protocol, portNumber }) {
  validateKwargs({ protocol, portNumber });
  try {
    const res = await upnpcCommand(`-e DAppNode -d ${portNumber} ${protocol}`);
    return parseCloseOutput(res);
  } catch (e) {
    parseCloseOutput(e.message);
    throw e;
  }
}

module.exports = close;
