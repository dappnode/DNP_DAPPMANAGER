const docker = require("modules/docker");
const { eventBus, eventBusTag } = require("eventBus");

/**
 * Calls docker rm and docker up on a package
 *
 * @param {string} id DNP .eth name
 */
const restartPackage = async ({ id }) => {
  if (!id) throw Error("kwarg id must be defined");

  await docker.restartDnp(id);

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: `Restarted package: ${id}`,
    logMessage: true,
    userAction: true
  };
};

module.exports = restartPackage;
