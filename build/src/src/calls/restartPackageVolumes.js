const docker = require("modules/docker");
const { eventBus, eventBusTag } = require("eventBus");
// Utils

/**
 * Removes a package volumes. The re-ups the package
 *
 * @param {string} id DNP .eth name
 */
async function restartPackageVolumes({ id }) {
  if (!id) throw Error("kwarg id must be defined");

  const removedVolumes = await docker.removeDnpVolumes(id, {
    restartDnpsAfter: true
  });

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: removedVolumes
      ? `Restarted ${id} volumes: ${removedVolumes.join(" ")}`
      : `${id} has no named volumes`,
    logMessage: true,
    userAction: true
  };
}

module.exports = restartPackageVolumes;
