const upnpcCommand = require("./upnpcCommand");
const validateKwargs = require("./validateKwargs");
const parseOpenOutput = require("./parseOpenOutput");

/**
 * Closes port = deletes port mapping
 * Actual command example:
 *   docker run --rm --net=host ${IMAGE} upnpc -e DAppNode -r 500 UDP
 *
 * @param {Object} kwargs: {
 *   protocol: 'TCP',
 *   portNumber: '3000'
 * }
 * @return {*}
 */
async function open({ protocol, portNumber }) {
  validateKwargs({ protocol, portNumber });
  try {
    const res = await upnpcCommand(`-e DAppNode -r ${portNumber} ${protocol}`);
    return parseOpenOutput(res);
  } catch (e) {
    parseOpenOutput(e.message);
    throw e;
  }
}

module.exports = open;
