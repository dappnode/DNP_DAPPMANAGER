const installPackage = require("./installPackage");

/**
 * Installs a package in safe mode, by setting options.BYPASS_RESOLVER = true
 *
 * @param {string} id DNP .eth name
 * @param {object} options install options
 * - BYPASS_CORE_RESTRICTION: Allows dncore DNPs from unverified sources (IPFS)
 * options = { BYPASS_CORE_RESTRICTION: true }
 */
const installPackageSafe = async ({ id, options = {} }) => {
  if (!id) throw Error("kwarg id must be defined");

  options.BYPASS_RESOLVER = true;
  return await installPackage({ id, options });
};

module.exports = installPackageSafe;
