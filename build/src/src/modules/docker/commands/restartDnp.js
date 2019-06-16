const composeRm = require("../lowLevelCommands/composeRm");
const composeUp = require("../lowLevelCommands/composeUp");
const dappmanagerRestartPatch = require("../lowLevelCommands/dappmanagerRestartPatch");

/**
 * Removes and ups a DNP's container
 *
 * @param {string} id "bitcoin.dnp.dappnode.eth"
 */
async function restartDnp(id) {
  if (id.includes("dappmanager.dnp.dappnode.eth")) {
    await dappmanagerRestartPatch(id);
  } else {
    await composeRm(id);
    await composeUp(id);
  }
}

module.exports = restartDnp;
