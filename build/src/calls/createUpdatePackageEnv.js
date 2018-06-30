const fs = require('fs');
const parse = require('../utils/parse');
const getPath = require('../utils/getPath');
const validate = require('../utils/validate');
const res = require('../utils/res');


// default option passed to allow testing
function createUpdatePackageEnv(params, docker) {
  return async function updatePackageEnv({id, envs, isCORE = false, restart}) {
    id = parse.packageReq(id).name; // parsing anyway for safety
    const envFilePath = getPath.envFileSmart(id, params, isCORE);

    // Write envs
    console.trace(envs);
    console.trace(parse.stringifyEnvs(envs));
    await fs.writeFileSync(
      validate.path(envFilePath),
      parse.stringifyEnvs(envs)
    );

    if (!restart) {
      return res.success('Updated envs of ' + id, {}, true);
    }

    const dockerComposePath = getPath.dockerComposeSmart(id, params);
    if (!fs.existsSync(dockerComposePath)) {
      throw Error('No docker-compose found with at: ' + dockerComposePath);
    }

    if (id.includes('dappmanager.dnp.dappnode.eth')) {
      throw Error('The installer cannot be restarted');
    }

    await docker.compose.down(dockerComposePath);
    await docker.compose.up(dockerComposePath);

    return res.success('Updated envs and restarted ' + id, {}, true);
  };
}


module.exports = createUpdatePackageEnv;
