const listContainers = require("./listContainers");
const { stringIncludes } = require("utils/strings");

/**
 * Gets a single dnp from listContainers
 * @param {string} idOrName
 * @returns {object} raw docker data
 */
async function getContainer(idOrName) {
  const containersRaw = await listContainers();
  const containerRaw = containersRaw.filter(
    ({ Id, Names }) =>
      stringIncludes(Id, idOrName) || stringIncludes(Names[0], idOrName)
  );
  if (!containerRaw.length)
    throw Error(`No container found for id: ${idOrName}`);
  if (containerRaw.length > 1)
    throw Error(`More than one container found for id: ${idOrName}`);
  return containerRaw[0];
}

module.exports = getContainer;
