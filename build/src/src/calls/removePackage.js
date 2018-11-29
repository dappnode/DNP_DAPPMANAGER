const fs = require('fs');
const getPath = require('utils/getPath');
const shell = require('utils/shell');
const logUI = require('utils/logUI');
const params = require('params');
const docker = require('modules/docker');
const dockerList = require('modules/dockerList');
const shouldOpenPorts = require('modules/shouldOpenPorts');
const {eventBus, eventBusTag} = require('eventBus');

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

  // CLOSE PORTS
  // portsToClose: '["32768/udp","32768/tcp"]'
  const dnpList = await dockerList.listContainers();
  const dnp = dnpList.find((_dnp) => _dnp.name && _dnp.name.includes(id));
  if (!dnp) {
    throw Error(`No DNP was found for name ${id}, so its ports cannot be closed`);
  }
  if (dnp.portsToClose.length && await shouldOpenPorts()) {
    const kwargs = {action: 'close', ports: dnp.portsToClose};
    eventBus.emit(eventBusTag.call, {callId: 'managePorts', kwargs});
  }

  // Remove container (and) volumes
  logUI({logId, name: 'all', msg: 'Shutting down containers...'});
  await docker.compose.down(dockerComposePath, {volumes: Boolean(deleteVolumes)});
  // Remove DNP folder and files
  logUI({logId, name: 'all', msg: 'Removing system files...'});
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
