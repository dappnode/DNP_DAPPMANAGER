const parseContainer = require("../parsers/parseContainer");
const getContainer = require("../lowLevelCommands/getContainer");

async function getDnpData(idOrName) {
  const container = await getContainer(idOrName);
  return parseContainer(container);
}

module.exports = getDnpData;
