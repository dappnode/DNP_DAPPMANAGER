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
  return async function logPackage({id, options}) {
    const dockerComposePath = getPath.dockerComposeSmart(id, params);
    if (!fs.existsSync(dockerComposePath)) {
      throw Error('No docker-compose found: ' + dockerComposePath);
    }

    const containerName = parse.containerName(dockerComposePath);
    const logs = await docker.log(containerName, options);

    return res.success('Got logs of package: ' + id, {
      id: id,
      logs,
    });
  };
}


module.exports = createLogPackage;
