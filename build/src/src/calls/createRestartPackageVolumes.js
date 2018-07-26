const fs = require('fs');
const getPath = require('utils/getPath');
const parseDefault = require('utils/parse');
const paramsDefault = require('params');
const dockerDefault = require('modules/docker');

// CALL DOCUMENTATION:
// > result = logs = <String with escape codes> (string)

function createRestartPackageVolumes({
  params = paramsDefault,
  docker = dockerDefault,
  parse = parseDefault,
}) {
  return async function restartPackageVolumes({
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

    // Remove volumes
    await docker.compose.rm(dockerComposePath, {v: true});
    for (const volumeName of packageVolumes) {
      await docker.volume.rm(volumeName);
    }
    // Restart docker to apply changes
    await docker.compose.up(dockerComposePath);

    return {
      message: 'Restarted '+id+' volumes: ' + packageVolumes.join(', '),
      log: true,
    };
  };
}


module.exports = createRestartPackageVolumes;
