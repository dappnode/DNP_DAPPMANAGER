const fs = require('fs');
const getPath = require('../utils/getPath');
const res = require('../utils/res');
const createRestartPatch = require('../utils/createRestartPatch');

// CALL DOCUMENTATION:
// > result = logs = <String with escape codes> (string)

function createRestartPackage(params,
  // default option passed to allow testing
  docker) {
  // patch to prevent installer from crashing
  const restartPatch = createRestartPatch(params, docker);

  return async function restartPackage({id}) {
    const dockerComposePath = getPath.dockerComposeSmart(id, params);
    if (!fs.existsSync(dockerComposePath)) {
      throw Error('No docker-compose found: ' + dockerComposePath);
    }

    if (id.includes('dappmanager.dnp.dappnode.eth')) {
      await restartPatch(id);
    }

    // Combining rm && up doesn't prevent the installer from crashing
    await docker.compose.rm_up(dockerComposePath);

    return res.success('Restarted package: ' + id, {}, true);
  };
}


module.exports = createRestartPackage;
