const getContainer = require("./getContainer");
const docker = require("../dockerApiSetup");

/**
 * Gets a single dnp from listContainers and instanciates it
 * @param {string} idOrName
 * @returns {object} dnp [See parseContainer output]
 */
async function getContainerInstance(idOrName) {
  const container = await getContainer(idOrName);
  return docker.getContainer(container.Id);
}

module.exports = getContainerInstance;
