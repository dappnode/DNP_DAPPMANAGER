const getContainerInstance = require("../lowLevelCommands/getContainerInstance");

async function getContainerWorkingDir(idOrName) {
  const container = await getContainerInstance(idOrName);
  const info = await container.inspect();
  return info.Config.WorkingDir || "/";
}

module.exports = getContainerWorkingDir;
