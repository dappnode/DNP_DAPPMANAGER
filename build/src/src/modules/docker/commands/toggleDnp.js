const checkDnpBlacklist = require("../lowLevelCommands/checkDnpBlacklist");
const getContainerInstance = require("../lowLevelCommands/getContainerInstance");

/**
 * Start or stop a DNP
 *
 * @param {string} idOrName bitcoin.dnp.dappnode.eth
 * @param {object} options
 * - timeout {number}
 */
async function toggleDnp(idOrName, { timeout } = {}) {
  checkDnpBlacklist("stop", idOrName);
  const container = await getContainerInstance(idOrName);
  const info = await container.inspect();
  if (info.State.Running) {
    await container.stop({ t: timeout });
  } else {
    await container.start();
  }
}

module.exports = toggleDnp;
