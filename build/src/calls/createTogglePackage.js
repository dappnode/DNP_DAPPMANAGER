const fs = require('fs');
const {containerStateFromPs} = require('../utils/dockerUtils');
const getPath = require('../utils/getPath');
const res = require('../utils/res');

// CALL DOCUMENTATION:
// > result = {}

function createTogglePackage(params,
  // default option passed to allow testing
  docker) {
  return async function togglePackage({args}) {
    const PACKAGE_NAME = args[0];
    const timeout = args[1] || 10;
    const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);

    if (!fs.existsSync(DOCKERCOMPOSE_PATH)) {
      throw Error('No docker-compose found with at: ' + DOCKERCOMPOSE_PATH);
    }

    let packageState = containerStateFromPs(
      await docker.compose.ps(DOCKERCOMPOSE_PATH),
      PACKAGE_NAME
    );

    // docker-compose states my contain extra info, i.e. Exit (137), Up (healthy)
    switch (packageState.split(' ')[0]) {
      case 'Up':
        await docker.compose.stop(DOCKERCOMPOSE_PATH, {timeout});
        break;

      case 'Exit':
        await docker.compose.start(DOCKERCOMPOSE_PATH);
        break;

      case 'Down':
        throw Error('Package ' + PACKAGE_NAME + ' is down, state: ' + packageState);

      default:
        throw Error('Unkown state: ' + packageState + ', for package: ' + PACKAGE_NAME);
    }

    return res.success('successfully toggled package: ' + PACKAGE_NAME, {}, true);
  };
}


module.exports = createTogglePackage;
