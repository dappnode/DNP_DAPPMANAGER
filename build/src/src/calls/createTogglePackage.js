const fs = require('fs');
const {containerStateFromPs} = require('../utils/dockerUtils');
const getPath = require('../utils/getPath');

// CALL DOCUMENTATION:
// > result = {}

function createTogglePackage(params,
  // default option passed to allow testing
  docker) {
  return async function togglePackage({id, timeout = 10}) {
    const dockerComposePath = getPath.dockerComposeSmart(id, params);
    if (!fs.existsSync(dockerComposePath)) {
      throw Error('No docker-compose found: ' + dockerComposePath);
    }

    let packageState = containerStateFromPs(
      await docker.compose.ps(dockerComposePath),
      id
    );

    // docker-compose states my contain extra info, i.e. Exit (137), Up (healthy)
    switch (packageState.split(' ')[0]) {
      case 'Up':
        await docker.compose.stop(dockerComposePath, {timeout});
        break;

      case 'Exit':
        await docker.compose.start(dockerComposePath);
        break;

      case 'Down':
        throw Error('Package ' + id + ' is down, state: ' + packageState);

      default:
        throw Error('Unkown state: ' + packageState + ', for package: ' + id);
    }

    return {
      message: 'successfully toggled package: ' + id,
      log: true,
    };
  };
}


module.exports = createTogglePackage;
