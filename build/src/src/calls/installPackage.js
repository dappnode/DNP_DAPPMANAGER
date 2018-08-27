const parse = require('utils/parse');
const {download, run} = require('modules/packages');
const getAllDependencies = require('modules/dependencies');


/**
 * Installs a package. It resolves dependencies, downloads
 * manifests and images, loads the images to docker, and calls
 * docker up on each package.
 *
 * @param {Object} kwargs: {
 *   id: package .eth name (string)
 *   logId: task id (string)
 * }
 * @return {Object} A formated success message.
 * result: empty
 */
const installPackage = async ({
  id,
  logId,
}) => {
  const packageReq = parse.packageReq(id);

  // Returns a list of unique dep (highest requested version) + requested package
  // > getManifest needs IPFS
  // > Returns an order to follow in order to install repecting dependencies
  let packageList = await getAllDependencies({packageReq, logId});

  // -> install in paralel
  await Promise.all(packageList.map((pkg) => download({pkg, logId})));

  // -> run in serie
  for (const pkg of packageList) {
    await run({pkg, logId});
  }

  return {
    message: 'Installed ' + packageReq.name + ' version: ' + packageReq.ver,
    logMessage: true,
    userAction: true,
  };
};


module.exports = installPackage;
