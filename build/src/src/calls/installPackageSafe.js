const installPackage = require('./installPackage');


/**
 * Installs a package in safe mode, by setting options.BYPASS_RESOLVER = true
 *
 * @param {Object} kwargs: {
 *   id: package .eth name (string)
 *   logId: task id (string)
 * }
 * @return {Object} A formated success message.
 * result: empty
 */
const installPackageSafe = async ({
  id,
  vols = {},
  logId,
  options = {},
}) => {
  options.BYPASS_RESOLVER = true;
  return await installPackage({id, vols, logId, options});
};


module.exports = installPackageSafe;
