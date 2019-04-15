const upnpcCommand = require("./upnpcCommand");
const validateKwargs = require("./validateKwargs");
const parseOpenOutput = require("./parseOpenOutput");

/**
 * Closes port = deletes port mapping
 * Actual command example:
 *   docker run --rm --net=host ${IMAGE} upnpc -e DAppNode -r 500 UDP
 *
 * @param {object} kwargs: {
 *   number: '3000',
 *   type: 'TCP',
 * }
 * @returns {*}
 */
async function open({ number, type }) {
  validateKwargs({ number, type });
  try {
    const res = await upnpcCommand(`-e DAppNode -r ${number} ${type}`);
    return parseOpenOutput(res);
  } catch (e) {
    parseOpenOutput(e.message);
    throw e;
  }
}

module.exports = open;
