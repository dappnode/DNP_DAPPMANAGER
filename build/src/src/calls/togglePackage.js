const docker = require("modules/docker");
const { eventBus, eventBusTag } = require("eventBus");

/**
 * Stops or starts after fetching its status
 *
 * @param {string} id DNP .eth name
 * @param {number} timeout seconds to stop the package
 */
const togglePackage = async ({ id, timeout = 10 }) => {
  if (!id) throw Error("kwarg id must be defined");

  await docker.toggleDnp(id, { timeout });

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: `Successfully toggled package: ${id}`,
    logMessage: true,
    userAction: true
  };
};

module.exports = togglePackage;
