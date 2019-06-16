const getContainerInstance = require("../lowLevelCommands/getContainerInstance");

/**
 * Get a DNP's docker logs
 *
 * @param {string} idOrName
 * @param {object} options
 * - timestamps {bool}
 * - tail {number}
 */
async function getDnpLogs(idOrName, { timestamps, tail } = {}) {
  const container = await getContainerInstance(idOrName);
  return container.logs({ stdout: true, stderr: true, timestamps, tail });
}

module.exports = getDnpLogs;
