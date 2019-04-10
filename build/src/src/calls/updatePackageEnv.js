const fs = require("fs");
const { eventBus, eventBusTag } = require("eventBus");
const params = require("params");
// Modules
const ipfs = require("modules/ipfs");
const docker = require("modules/docker");
// Utils
const parse = require("utils/parse");
const getPath = require("utils/getPath");
const envsHelper = require("utils/envsHelper");

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
const updatePackageEnv = async ({ id, envs, isCORE, isCore, restart }) => {
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

  // Support both notations
  isCore = isCore || isCORE;

  // Write envs
  const previousEnvs = envsHelper.load(id, isCore);
  envsHelper.write(id, isCore, { ...previousEnvs, ...envs });

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
