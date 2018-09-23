const parse = require('utils/parse');
const {download, run} = require('modules/packages');
const dappGet = require('modules/dappGet');
const logUI = require('utils/logUI');
const {eventBus, eventBusTag} = require('eventBus');


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
const installPackage = async ({
  id,
  vols = {},
  logId,
  options = {},
}) => {
  // 1. Parse the id into a request
  // id = 'otpweb.dnp.dappnode.eth@0.1.4'
  // req = { name: 'otpweb.dnp.dappnode.eth', ver: '0.1.4' }
  const req = parse.packageReq(id);

  // 2. Resolve the request
  await dappGet.update(req);
  const result = await dappGet.resolve(req);
  // res = {
  // success: {'bind.dnp.dappnode.eth': '0.1.4'}
  // state: {'bind.dnp.dappnode.eth': '0.1.2'}
  // }
  // Return error if the req couldn't be resolved
  if (!result.success) {
    throw Error('Request could not be resolved: '+req.name+'@'+req.ver);
  }
  const {success: newState, state, manifests} = result;

  // 3. Format the request and filter out already updated packages
  let pkgs = Object.keys(newState).filter((pkgName) => {
    // 3.1 Check if the requested version is different than the current
    const shouldInstall = newState[pkgName] !== state[pkgName];
    if (!shouldInstall) {
      logUI({logId, pkgName, msg: 'Already updated'});
      delete state[pkgName];
    }
    return shouldInstall;
  }).map((pkgName) => {
    // 3.2 Fetch manifest
    const manifest = manifests[pkgName];
    if (!manifest) throw Error('Missing manifest for '+pkgName);

    // 3.3 Verify dncore condition
    if (manifest.type == 'dncore') {
      if (options.BYPASS_CORE_RESTRICTION || pkgName.endsWith('.dnp.dappnode.eth')) {
        manifest.isCore = true;
      } else {
        // inform the user of improper usage
        throw Error('Unverified CORE package request: '+pkgName);
      }
    }

    // 3.4 Edit volumes if provided by the user
    // "vols": {
    //   "data:/root/.bitmonero": "monero_data"
    // },
    if (pkgName === req.name && Object.keys(vols).length) {
      const {volumes = []} = ((manifest || {}).image || {});
      volumes.forEach((vol, i) => {
        if (vols[vol]) manifest.image.volumes[i] = vols[vol]+':'+vol.split(':')[1];
      });
    }

    // Return pkg object
    return {
      name: pkgName,
      ver: newState[pkgName],
      manifest,
    };
  });

  // 4. Download requested packages
  await Promise.all(pkgs.map((pkg) => download({pkg, logId})));
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

  // 5. Run requested packages
  await Promise.all(pkgs.map((pkg) => run({pkg, logId})));

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: 'Installed ' + req.req,
    logMessage: true,
    userAction: true,
  };
};


module.exports = installPackage;
