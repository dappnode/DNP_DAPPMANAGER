const fs = require("fs");
const params = require("params");
const logs = require("logs.js")(module);
// Modules
const dockerList = require("modules/dockerList");
const docker = require("modules/docker");
// Utils
const parseDockerSystemDf = require("utils/parseDockerSystemDf");
const getPath = require("utils/getPath");
const envsHelper = require("utils/envsHelper");

// This call can fail because of:
//   Error response from daemon: a disk usage operation is already running
// Prevent running it twice
let isRunning;
let cacheResult;
async function dockerSystemDf() {
  if (isRunning && cacheResult) return cacheResult;
  isRunning = true;
  cacheResult = await docker.systemDf();
  isRunning = false;
  return cacheResult;
}

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

  // Append volume info
  // This call can fail because of:
  //   Error response from daemon: a disk usage operation is already running
  try {
    const dockerSystemDfData = await dockerSystemDf();
    dnpList = parseDockerSystemDf({ data: dockerSystemDfData, dnpList });
  } catch (e) {
    logs.error("Error appending volume info in listPackages call: " + e.stack);
  }

  // Append envFile and manifest
  dnpList.map(dnp => {
    // Add env info, only if there are ENVs
    const envs = envsHelper.load(dnp.name, dnp.isCORE || dnp.isCore);
    if (Object.keys(envs).length) dnp.envs = envs;

    // Add manifest
    const manifestPath = getPath.manifest(
      dnp.name,
      params,
      dnp.isCORE || dnp.isCore
    );
    if (fs.existsSync(manifestPath)) {
      const manifestFileData = fs.readFileSync(manifestPath, "utf8");
      dnp.manifest = JSON.parse(manifestFileData);
    }
  });

  return {
    message: "Listing " + dnpList.length + " packages",
    result: dnpList
  };
};

module.exports = listPackages;
