const getPath = require('utils/getPath');
const parse = require('utils/parse');
const paramsDefault = require('params');
const dockerDefault = require('modules/docker');

// CALL DOCUMENTATION:
// > kwargs: id
// > result: empty = {}

function createTogglePackage({
  params = paramsDefault,
  docker = dockerDefault,
}) {
  const togglePackage = async ({
    id,
    timeout = 10,
  }) => {
    const dockerComposePath = getPath.dockerComposeSmart(id, params);
    // This parse utility already throws if no docker-compose found
    let containerName = parse.containerName(dockerComposePath);

    let packageState = await docker.status(containerName);

    // docker-compose states my contain extra info, i.e. Exit (137), Up (healthy)
    switch (packageState.split(' ')[0].trim()) {
      case 'running':
        await docker.compose.stop(dockerComposePath, {timeout});
        break;
      case 'exited':
        await docker.compose.start(dockerComposePath);
        break;
      default:
        throw Error('Unkown state: ' + packageState + ', for package: ' + id);
    }

    return {
      message: 'successfully toggled package: ' + id,
      logMessage: true,
      userAction: true,
    };
  };

  // Expose main method
  return togglePackage;
}


module.exports = createTogglePackage;
