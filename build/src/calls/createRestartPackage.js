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

  return async function restartPackage({args}) {
    const PACKAGE_NAME = args[0];
    const IS_CORE = args[1];
    const CORE_PACKAGE_NAME = IS_CORE ? PACKAGE_NAME : null;

    const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params, IS_CORE);
    if (!fs.existsSync(DOCKERCOMPOSE_PATH)) {
      throw Error('No docker-compose found with at: ' + DOCKERCOMPOSE_PATH);
    }

    if (PACKAGE_NAME.includes('dappmanager.dnp.dappnode.eth')) {
      await restartPatch(PACKAGE_NAME);
    }

    // Combining rm && up doesn't prevent the installer from crashing
    await docker.compose.rm_up(DOCKERCOMPOSE_PATH, {core: CORE_PACKAGE_NAME});

    return res.success('Restarted package: ' + PACKAGE_NAME, {}, true);
  };
}


module.exports = createRestartPackage;
