const upnpcCommand = require("./upnpcCommand");
const validateKwargs = require("./validateKwargs");
const parseOpenOutput = require("./parseOpenOutput");

/**
 * Opens port = adds port mapping
 * Actual command example:
 *   docker run --rm --net=host ${IMAGE} upnpc -e DAppNode -r 500 UDP 7200
 *
 * @param {object} kwargs: {
 *   portNumber: '3000',
 *   protocol: 'TCP',
 * }
 * @returns {*}
 */
// Timeout in seconds. Should be greater than the natRenewalInterval
const natRenewalTimeout = 120 * 60;

async function open({ portNumber, protocol }) {
  validateKwargs({ portNumber, protocol });
  try {
    const res = await upnpcCommand(
      `-e DAppNode -r ${portNumber} ${protocol} ${natRenewalTimeout}`
    );
    return parseOpenOutput(res);
  } catch (e) {
    parseOpenOutput(e.message);
    throw e;
  }
}

module.exports = open;
