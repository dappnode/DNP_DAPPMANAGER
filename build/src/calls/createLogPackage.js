const fs = require('fs');
const getPath = require('../utils/getPath');
const res = require('../utils/res');
const parse = require('../utils/parse');

// CALL DOCUMENTATION:
// > result = logs = <String with escape codes> (string)

// If it is core, send ['dnp_bind', true]

function createLogPackage(params,
  // default option passed to allow testing
  docker) {
  return async function logPackage(req) {
    const PACKAGE_NAME = req[0];
    const IS_CORE = req[1];
    const OPTIONS = req[2] ? JSON.parse(req[2]) : {};

    const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params, IS_CORE);
    if (!fs.existsSync(DOCKERCOMPOSE_PATH)) {
      throw Error('No docker-compose found with at: ' + DOCKERCOMPOSE_PATH);
    }

    const CONTAINER_NAME = parse.containerName(DOCKERCOMPOSE_PATH);

    let logs = await docker.log(CONTAINER_NAME, OPTIONS);

    return res.success('Got logs of package: ' + PACKAGE_NAME, {
      name: PACKAGE_NAME,
      logs,
    });
  };
}


module.exports = createLogPackage;
