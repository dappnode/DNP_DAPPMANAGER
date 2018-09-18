const parse = require('utils/parse');
const {download, run} = require('modules/packages');
const {eventBus, eventBusTag} = require('eventBus');
const getManifest = require('modules/getManifest');


/**
 * Installs a package. It resolves dependencies, downloads
 * manifests and images, loads the images to docker, and calls
 * docker up on each package.
 * It has extra functionality for special cases
 * - allowCore: If a manifest requests a package to be core
 *   it will only be granted if
 *   1. Its manifest comes from APM and .dnp.dappnode.eth
 *   2. It comes from IPFS and the BYPASS_CORE_RESTRICTION env is true
 * - Special versions: It needs to deal with two cases
 *   1. ver = 'latest'
 *   2. ver = '/ipfs/QmZ87fb2...'
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
  logId,
  options = {},
}) => {
  // 1. Parse the id into a request
  // id = 'otpweb.dnp.dappnode.eth@0.1.4'
  // req = { name: 'otpweb.dnp.dappnode.eth', ver: '0.1.4' }
  const req = parse.packageReq(id);

  // 2. Only get first order dependencies
  const manifest = await getManifest(req);
  if (!manifest) {
    throw Error('Manifest could not be found for: '+req.name+'@'+req.ver);
  }
  const pkgs = [
    {
      name: req.name,
      ver: req.ver,
      manifest,
    },
  ];
  const dependencies = manifest.dependencies || {};
  await Promise.all(Object.keys(dependencies).map(async (dep) => {
      const depManifest = await getManifest(parse.packageReq(dep));
      if (!depManifest) {
        throw Error('Manifest could not be found for: '+dep);
      }
      pkgs.push({
        name: dep,
        ver: depManifest.version,
        manifest: depManifest,
      });
  }));

  // res = {
  // success: {'bind.dnp.dappnode.eth': '0.1.4'}
  // state: {'bind.dnp.dappnode.eth': '0.1.2'}
  // }
  // Return error if the req couldn't be resolved


  // 4. Download requested packages
  await Promise.all(pkgs.map((pkg) => download({pkg, logId})));

  // 5. Run requested packages
  // Patch, install the dappmanager the last always
  let dappmanagerPkg;
  await Promise.all(pkgs
    .filter((pkg) => {
      if (pkg.manifest.name.includes('dappmanager.dnp.dappnode.eth')) {
        dappmanagerPkg = pkg;
        return false;
      } else {
        return true;
      }
    }).map((pkg) => run({pkg, logId})));

  if (dappmanagerPkg) await run({pkg: dappmanagerPkg, logId});

  // 6. Clean install files

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: 'Installed ' + req.req,
    logMessage: true,
    userAction: true,
  };
};


module.exports = installPackageSafe;
