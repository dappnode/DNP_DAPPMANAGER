const fs = require('fs');
const getPath = require('utils/getPath');
const parse = require('utils/parse');
const params = require('params');
const docker = require('modules/docker');
const {eventBus, eventBusTag} = require('eventBus');


/**
 * Removes a package volumes. The re-ups the package
 *
 * @param {Object} kwargs: {
 *   id: package .eth name (string)
 * }
 * @return {Object} A formated success message.
 * result: empty
 */
async function restartPackageVolumes({
  id,
}) {
  const dockerComposePath = getPath.dockerComposeSmart(id, params);
  if (!fs.existsSync(dockerComposePath)) {
    throw Error('No docker-compose found: ' + dockerComposePath);
  }

  if (id.includes('dappmanager.dnp.dappnode.eth')) {
    throw Error('The installer cannot be restarted');
  }

  const packageVolumes = parse.serviceVolumes(dockerComposePath, id);

  // If there are no volumes don't do anything
  if (!packageVolumes.length) {
    return {
      message: id+' has no volumes ',
    };
  }

  await docker.compose.down(dockerComposePath, {volumes: true});

  // Restart docker to apply changes
  await docker.compose.up(dockerComposePath);

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: 'Restarted '+id+' volumes: ' + packageVolumes.join(', '),
    logMessage: true,
    userAction: true,
  };
}


module.exports = restartPackageVolumes;
