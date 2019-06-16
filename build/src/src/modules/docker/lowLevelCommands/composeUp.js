const dappmanagerRestartPatch = require("./dappmanagerRestartPatch");
const getComposeInstance = require("./getComposeInstance");

/**
 * Call docker-compose up on a DNP by name
 *
 * @param {string} id bitcoin.dnp.dappnode.eth
 */
async function composeUp(id) {
  if (id.includes("dappmanager.dnp.dappnode.eth")) {
    await dappmanagerRestartPatch(id);
  } else {
    const compose = getComposeInstance(id);
    await compose.up();
  }
}

module.exports = composeUp;
