const checkDnpBlacklist = require("./checkDnpBlacklist");
const getComposeInstance = require("./getComposeInstance");

/**
 * Call docker-compose rm on a DNP by name
 *
 * @param {string} id bitcoin.dnp.dappnode.eth
 */
async function composeRm(id) {
  checkDnpBlacklist("down", id);
  const compose = getComposeInstance(id);
  await compose.rm();
}

module.exports = composeRm;
