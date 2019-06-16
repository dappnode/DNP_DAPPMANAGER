const { eventBus, eventBusTag } = require("eventBus");
// Modules
const docker = require("modules/docker");
// Utils
const envsHelper = require("utils/envsHelper");

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
const updatePackageEnv = async ({ id, envs }) => {
  if (!id) throw Error("kwarg id must be defined");
  if (!envs) throw Error("kwarg envs must be defined");

  // Write envs
  const dnp = await docker.getDnpData(id);
  const previousEnvs = envsHelper.load(id, dnp.isCore);
  envsHelper.write(id, dnp.isCore, { ...previousEnvs, ...envs });

  await docker.composeUp(id);

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: `Updated ${id} ENVs`,
    logMessage: true,
    userAction: true
  };
};

module.exports = updatePackageEnv;
