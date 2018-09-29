const fs = require('fs');
const ipfs = require('../modules/ipfs');
const parse = require('../utils/parse');
const getPath = require('../utils/getPath');
const validate = require('../utils/validate');
const params = require('../params');
const docker = require('../modules/docker');
const {eventBus, eventBusTag} = require('../eventBus');


/**
 * Updates the .env file of a package. If requested, also re-ups it
 *
 * @param {Object} kwargs: {
 *   id: package .eth name (string)
 *   envs: enviroment variables (object)
 *   isCore: (boolean)
 *   restart: flag to restart the package (boolean)
 * }
 * @return {Object} A formated success message.
 * result: empty
 */
const updatePackageEnv = async ({
  id,
  envs,
  isCORE = false,
  restart,
}) => {
  id = parse.packageReq(id).name; // parsing anyway for safety
  if (id.startsWith('/ipfs/')) {
    try {
      const manifest = JSON.parse( await ipfs.cat(id) );
      id = manifest.name;
    } catch (e) {
      throw Error('Could not retrieve package name from manifest of '+id, e.stack);
    }
  }
  const envFilePath = getPath.envFileSmart(id, params, isCORE);

  // Write envs
  await fs.writeFileSync(
    validate.path(envFilePath),
    parse.stringifyEnvs(envs)
  );

  if (!restart) {
    return {
      message: 'Updated envs of ' + id,
      logMessage: true,
      userAction: true,
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

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: 'Updated envs and restarted ' + id,
    logMessage: true,
    userAction: true,
  };
};


module.exports = updatePackageEnv;
