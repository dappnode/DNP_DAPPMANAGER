const fs = require("fs");
const getPath = require("utils/getPath");
const restartPatch = require("modules/restartPatch");
const params = require("params");
const docker = require("modules/docker");
const { eventBus, eventBusTag } = require("eventBus");

/**
 * Calls docker rm and docker up on a package
 *
 * @param {Object} kwargs: {
 *   id: package .eth name (string)
 * }
 * @return {Object} A formated success message.
 * result: empty
 */
const restartPackage = async ({ id }) => {
  if (!id) throw Error("kwarg id must be defined");

  const dockerComposePath = getPath.dockerComposeSmart(id, params);
  if (!fs.existsSync(dockerComposePath)) {
    throw Error("No docker-compose found: " + dockerComposePath);
  }

  if (id.includes("dappmanager.dnp.dappnode.eth")) {
    await restartPatch(id);
  }

  // Combining rm && up doesn't prevent the installer from crashing
  await docker.compose.rm(dockerComposePath);
  await docker.safe.compose.up(dockerComposePath);

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: "Restarted package: " + id,
    logMessage: true,
    userAction: true
  };
};

module.exports = restartPackage;
