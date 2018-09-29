const fs = require('fs');
const getPath = require('../utils/getPath');
const shell = require('../utils/shell');
const logUI = require('../utils/logUI');
const params = require('../params');
const docker = require('../modules/docker');
const {eventBus, eventBusTag} = require('../eventBus');

/**
 * Remove package data: docker down + disk files
 *
 * @param {Object} kwargs: {
 *   id: package .eth name (string)
 *   deleteVolumes: flag to also clear permanent package data
 *   logId: task id (string)
 * }
 * @return {Object} A formated success message.
 * result: empty
 */
const removePackage = async ({
  id,
  deleteVolumes = false,
  logId,
}) => {
  const packageRepoDir = getPath.packageRepoDir(id, params);

  const dockerComposePath = getPath.dockerComposeSmart(id, params);
  if (!fs.existsSync(dockerComposePath)) {
    throw Error('No docker-compose found: ' + dockerComposePath);
  }

  if (id.includes('dappmanager.dnp.dappnode.eth')) {
    throw Error('The installer cannot be restarted');
  }

  // Remove container (and) volumes
  logUI({logId, pkg: 'all', msg: 'Shutting down containers...'});
  await docker.compose.down(dockerComposePath, {volumes: Boolean(deleteVolumes)});
  // Remove DNP folder and files
  logUI({logId, pkg: 'all', msg: 'Removing system files...'});
  await shell('rm -r ' + packageRepoDir);

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: 'Removed package: ' + id,
    logMessage: true,
    userAction: true,
  };
};


module.exports = removePackage;
