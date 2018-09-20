const fs = require('fs');
const dockerList = require('modules/dockerList');
const getPath = require('utils/getPath');
const parse = require('utils/parse');
const params = require('params');


/**
 * Returns the list of current containers associated to packages
 *
 * @param {Object} kwargs: {}
 * @return {Object} A formated success message.
 * result: packages =
 *   [
 *     {
 *       id: '9238523572017423619487623894', (string)
 *       isDNP: true, (boolean)
 *       created: <Date string>,
 *       image: <Image Name>, (string)
 *       name: otpweb.dnp.dappnode.eth, (string)
 *       shortName: otpweb, (string)
 *       version: '0.0.4', (string)
 *       ports: <list of ports>, (string)
 *       state: 'exited', (string)
 *       running: true, (boolean)
 *       ...
 *       envs: <Env variables> (object)
 *     },
 *     ...
 *   ]
 */
const listPackages = async () => {
  let dnpList = await dockerList.listContainers();

  dnpList.map((dnp) => {
    const PACKAGE_NAME = dnp.name;
    const IS_CORE = dnp.isCORE;

    // Add env info
    const ENV_FILE = getPath.envFile(PACKAGE_NAME, params, IS_CORE);
    if (fs.existsSync(ENV_FILE)) {
      let envFileData = fs.readFileSync(ENV_FILE, 'utf8');
      dnp.envs = parse.envFile(envFileData);
    }

    // Add manifest
    let MANIFEST_FILE = getPath.manifest(PACKAGE_NAME, params, IS_CORE);
    if (fs.existsSync(MANIFEST_FILE)) {
      let manifestFileData = fs.readFileSync(MANIFEST_FILE, 'utf8');
      dnp.manifest = JSON.parse(manifestFileData);
    }
  });

  return {
    message: 'Listing ' + dnpList.length + ' packages',
    result: dnpList,
  };
};


module.exports = listPackages;
