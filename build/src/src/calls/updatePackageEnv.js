const fs = require("fs");
const { eventBus, eventBusTag } = require("eventBus");
const params = require("params");
// Modules
const ipfs = require("modules/ipfs");
const docker = require("modules/docker");
const dockerList = require("modules/dockerList");
// Utils
const parse = require("utils/parse");
const getPath = require("utils/getPath");
const envsHelper = require("utils/envsHelper");
const { stringIncludes } = require("utils/strings");

/**
 * Updates the .env file of a package. If requested, also re-ups it
 *
 * @param {string} id DNP .eth name
 * @param {object} envs environment variables
 * envs = {
 *   ENV_NAME: ENV_VALUE
 * }
 * @param {bool} restart flag to restart the DNP
 */
const updatePackageEnv = async ({ id, envs, restart }) => {
  if (!id) throw Error("kwarg id must be defined");
  if (!envs) throw Error("kwarg envs must be defined");

  id = parse.packageReq(id).name; // parsing anyway for safety
  if ((id || "").startsWith("/ipfs/")) {
    try {
      const manifest = JSON.parse(await ipfs.cat(id));
      id = manifest.name;
    } catch (e) {
      throw Error(
        `Could not retrieve package name from manifest of ${id}`,
        e.stack
      );
    }
  }

  const dnpList = await dockerList.listContainers();
  const dnp = dnpList.find(_dnp => stringIncludes(_dnp.name, id));
  if (!dnp) {
    throw Error(`No DNP was found for name ${id}`);
  }

  // Write envs
  const previousEnvs = envsHelper.load(id, dnp.isCore);
  envsHelper.write(id, dnp.isCore, { ...previousEnvs, ...envs });

  if (restart) {
    const dockerComposePath = getPath.dockerComposeSmart(id, params);
    if (!fs.existsSync(dockerComposePath)) {
      throw Error(`No docker-compose found with at: ${dockerComposePath}`);
    }

    if (id.includes("dappmanager.dnp.dappnode.eth")) {
      throw Error("The installer cannot be restarted");
    }

    await docker.safe.compose.up(dockerComposePath);

    // Emit packages update
    eventBus.emit(eventBusTag.emitPackages);
  }

  return {
    message: `Updated envs of ${id} ${restart ? "and restarted" : ""} `,
    logMessage: true,
    userAction: true
  };
};

module.exports = updatePackageEnv;
