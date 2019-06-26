const fs = require("fs");
const params = require("params");
const { eventBus, eventBusTag } = require("eventBus");
// Modules
const docker = require("modules/docker");
// External call
const restartPackageVolumes = require("./restartPackageVolumes");
// Utils
const getPath = require("utils/getPath");
const shell = require("utils/shell");

/**
 * Remove package data: docker down + disk files
 *
 * @param {string} id DNP .eth name
 * @param {bool} deleteVolumes flag to also clear permanent package data
 */
const removePackage = async ({ id, deleteVolumes = false }) => {
  if (!id) throw Error("kwarg id must be defined");

  const packageRepoDir = getPath.packageRepoDir(id, params);

  const dockerComposePath = getPath.dockerComposeSmart(id, params);
  if (!fs.existsSync(dockerComposePath)) {
    throw Error(`No docker-compose found: ${dockerComposePath}`);
  }

  if (id.includes("dappmanager.dnp.dappnode.eth")) {
    throw Error("The installer cannot be removed");
  }

  /**
   * [NOTE] Not necessary to close the ports since they will just
   * not be renewed in the next interval
   */

  // Call restartPackageVolumes to safely delete dependant volumes
  if (deleteVolumes) await restartPackageVolumes({ id, doNotRestart: true });
  // Remove container (and) volumes
  await docker.compose.down(dockerComposePath, {
    volumes: Boolean(deleteVolumes)
  });
  // Remove DNP folder and files
  await shell(`rm -r ${packageRepoDir}`);

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);
  eventBus.emit(eventBusTag.packageModified);

  return {
    message: `Removed package: ${id}`,
    logMessage: true,
    userAction: true
  };
};

module.exports = removePackage;
