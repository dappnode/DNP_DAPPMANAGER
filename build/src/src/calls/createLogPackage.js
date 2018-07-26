const fs = require('fs');
const getPath = require('utils/getPath');
const parse = require('utils/parse');
const paramsDefault = require('params');
const dockerDefault = require('modules/docker');

// CALL DOCUMENTATION:
// > kwargs: {
//     id,
//     isCore,
//     options
//   }
// > result: {
//     id,
//     logs: <String with escape codes> (string)
//   }

function createLogPackage({
  params = paramsDefault,
  docker = dockerDefault,
}) {
  const logPackage = async ({
    id,
    options,
  }) => {
    const dockerComposePath = getPath.dockerComposeSmart(id, params);
    if (!fs.existsSync(dockerComposePath)) {
      throw Error('No docker-compose found: ' + dockerComposePath);
    }

    const containerName = parse.containerName(dockerComposePath);
    const logs = await docker.log(containerName, options);

    return {
      message: 'Got logs of ' + id,
      result: {
        id: id,
        logs,
      },
    };
  };

  // Expose main method
  return logPackage;
}


module.exports = createLogPackage;
