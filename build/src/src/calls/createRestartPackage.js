const fs = require('fs');
const getPath = require('utils/getPath');
const createRestartPatch = require('utils/createRestartPatch');
const paramsDefault = require('params');
const dockerDefault = require('modules/docker');

// CALL DOCUMENTATION:
// > kwargs: id
// > result: empty = {}

function createRestartPackage({
  params = paramsDefault,
  docker = dockerDefault,
}) {
  // patch to prevent installer from crashing
  const restartPatch = createRestartPatch(params, docker);

  // Declare main method
  const restartPackage = async ({
    id,
  }) => {
    const dockerComposePath = getPath.dockerComposeSmart(id, params);
    if (!fs.existsSync(dockerComposePath)) {
      throw Error('No docker-compose found: ' + dockerComposePath);
    }

    if (id.includes('dappmanager.dnp.dappnode.eth')) {
      await restartPatch(id);
    }

    // Combining rm && up doesn't prevent the installer from crashing
    await docker.compose.rm_up(dockerComposePath);

    return {
      message: 'Restarted package: ' + id,
      logMessage: true,
    };
  };

  // Expose main method
  return restartPackage;
}


module.exports = createRestartPackage;
