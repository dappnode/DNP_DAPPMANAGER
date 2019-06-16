const getComposeInstance = require("./getComposeInstance");
const checkDnpBlacklist = require("./checkDnpBlacklist");

/**
 * Call docker-compose down on a DNP by name
 *
 * @param {string} id bitcoin.dnp.dappnode.eth
 * @param {object} options
 * - volumes: {bool}
 * - timeout: {number}
 */
async function composeDown(id, { volumes, timeout } = {}) {
  checkDnpBlacklist("down", id);
  const compose = getComposeInstance(id);
  return await compose.down({ volumes, timeout });
}

module.exports = composeDown;
