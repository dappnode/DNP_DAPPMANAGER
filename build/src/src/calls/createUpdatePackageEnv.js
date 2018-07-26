const fs = require('fs');
const parse = require('utils/parse');
const getPath = require('utils/getPath');
const validate = require('utils/validate');
const paramsDefault = require('params');
const dockerDefault = require('modules/docker');

// CALL DOCUMENTATION:
// > kwargs: id
// > result: empty = {}

function createUpdatePackageEnv({
  params = paramsDefault,
  docker = dockerDefault,
}) {
  const updatePackageEnv = async ({
    id,
    envs,
    isCORE = false,
    restart,
  }) => {
    id = parse.packageReq(id).name; // parsing anyway for safety
    const envFilePath = getPath.envFileSmart(id, params, isCORE);

    // Write envs
    await fs.writeFileSync(
      validate.path(envFilePath),
      parse.stringifyEnvs(envs)
    );

    if (!restart) {
      return {
        message: 'Updated envs of ' + id,
        log: true,
      };
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

    return {
      message: 'Updated envs and restarted ' + id,
      log: true,
    };
  };

  // Expose main method
  return updatePackageEnv;
}


module.exports = createUpdatePackageEnv;
