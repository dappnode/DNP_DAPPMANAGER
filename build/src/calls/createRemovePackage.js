const fs = require('fs');
const getPath = require('../utils/getPath');
const res = require('../utils/res');
const shellSync = require('../utils/shell');
const parse = require('../utils/parse');

// CALL DOCUMENTATION:
// > result = {}

function createRemovePackage(params,
  // default option passed to allow testing
  docker) {
  return async function removePackage({args}) {
    const PACKAGE_NAME = args[0];
    const DELETE_VOLUMES = args[1] || false;
    const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);
    const PACKAGE_REPO_DIR_PATH = getPath.packageRepoDir(PACKAGE_NAME, params);

    if (!fs.existsSync(DOCKERCOMPOSE_PATH)) {
      throw Error('No docker-compose found with at: ' + DOCKERCOMPOSE_PATH);
    }

    if (PACKAGE_NAME.includes('dappmanager.dnp.dappnode.eth')) {
      throw Error('The installer cannot be restarted');
    }

    // Close ports
    await closePorts(DOCKERCOMPOSE_PATH, docker);

    // Remove container (and) volumes
    await docker.compose.down(DOCKERCOMPOSE_PATH, {volumes: Boolean(DELETE_VOLUMES)});
    // Remove DNP folder and files
    await shellSync('rm -r ' + PACKAGE_REPO_DIR_PATH);

    return res.success('Removed package: ' + PACKAGE_NAME, {}, true);
  };
}

async function closePorts(DOCKERCOMPOSE_PATH, docker) {
  const ports = parse.dockerComposePorts(DOCKERCOMPOSE_PATH);
  for (const port of ports) {
    await docker.closePort(port);
  }
}


module.exports = createRemovePackage;
