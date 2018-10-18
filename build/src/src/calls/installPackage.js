const parse = require('utils/parse');
const {download, run} = require('modules/packages');
const dappGet = require('modules/dappGet');
const logUI = require('utils/logUI');
const getManifest = require('modules/getManifest');
const {eventBus, eventBusTag} = require('eventBus');
const isSyncing = require('utils/isSyncing');


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
  if (await isSyncing()) {
    throw Error('Mainnet is syncing');
  }

  // 1. Parse the id into a request
  // id = 'otpweb.dnp.dappnode.eth@0.1.4'
  // req = { name: 'otpweb.dnp.dappnode.eth', ver: '0.1.4' }
  const req = parse.packageReq(id);

  // 2. Resolve the request
  try {
    await dappGet.update(req);
  } catch (e) {
    throw Error(`Error updating DNP repo: ${e.stack || e.message}`);
  }

  let result;
  // res = {
  //     success: {'bind.dnp.dappnode.eth': '0.1.4'}
  //     state: {'bind.dnp.dappnode.eth': '0.1.2'}
  // }
  try {
    result = await dappGet.resolve(req);
  } catch (e) {
    throw Error(`Error resolving dependencies: ${e.stack || e.message}`);
  }
  // Return error if the req couldn't be resolved
  if (!result.success) {
    throw Error('Request could not be resolved: '+req.name+'@'+req.ver);
  }

  const {success: newState, state} = result;

  // 3. Format the request and filter out already updated packages
  let pkgs = await Promise.all(Object.keys(newState).filter((name) => {
    // 3.1 Check if the requested version is different than the current
    const shouldInstall = newState[name] !== state[name];
    if (!shouldInstall) {
      logUI({logId, name, msg: 'Already updated'});
      delete state[name];
    }
    return shouldInstall;
  }).map(async (name) => {
    // 3.2 Fetch manifest
    const ver = newState[name];
    const manifest = await getManifest({name, ver});
    if (!manifest) throw Error('Missing manifest for '+name);

    // 3.3 Verify dncore condition
    // Prevent default values. Someone can try to spoof "isCore" in the manifest
    manifest.isCore = false;
    if (manifest.type == 'dncore') {
      if (options.BYPASS_CORE_RESTRICTION) {
        manifest.isCore = true;
      } else if (
        // The origin must be the registry controlled by the DAppNode team
        name.endsWith('.dnp.dappnode.eth')
        // It must NOT come from ipfs, thus APM
        && !ver.startsWith('/ipfs/')
      ) {
        manifest.isCore = true;
      } else {
        // inform the user of improper usage
        /* eslint-disable max-len */
        throw Error(`Unverified core package ${name}, only allowed origin is .dnp.dappnode.eth APM registy`);
        /* eslint-enable max-len */
      }
    }

    // 3.4 Edit volumes if provided by the user
    // "vols": {
    //   "data:/root/.bitmonero": "monero_data"
    // },
    if (name === req.name && Object.keys(vols).length) {
      const {volumes = []} = ((manifest || {}).image || {});
      volumes.forEach((vol, i) => {
        if (vols[vol]) manifest.image.volumes[i] = vols[vol]+':'+vol.split(':')[1];
      });
    }

    // Return pkg object
    return {
      name,
      ver,
      manifest,
    };
  }));

  // 4. Download requested packages
  await Promise.all(pkgs.map((pkg) => download({pkg, logId})));

  // 5. Run requested packages
  // Patch, install the dappmanager the last always
  const isDappmanager = (pkg) => pkg.manifest && pkg.manifest.name
    && pkg.manifest.name.includes('dappmanager.dnp.dappnode.eth');

  await Promise.all(pkgs
    .filter((pkg) => !isDappmanager(pkg))
    .map((pkg) => run({pkg, logId}))
  );

  const dappmanagerPkg = pkgs.find(isDappmanager);
  if (dappmanagerPkg) {
    await run({pkg: dappmanagerPkg, logId});
  }

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: 'Installed ' + req.req,
    logMessage: true,
    userAction: true,
  };
};


module.exports = installPackage;
