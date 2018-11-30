const parse = require('utils/parse');
const merge = require('utils/merge');
const packages = require('modules/packages');
const dappGet = require('modules/dappGet');
const getManifest = require('modules/getManifest');
const dockerList = require('modules/dockerList');
const lockPorts = require('modules/lockPorts');
const shouldOpenPorts = require('modules/shouldOpenPorts');
const {eventBus, eventBusTag} = require('eventBus');
const isSyncing = require('utils/isSyncing');
const logUI = require('utils/logUI');
const isIpfsRequest = require('utils/isIpfsRequest');
const logs = require('logs.js')(module);


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
 * @param {Object} kwargs = {
 *   id: package .eth name {String}
 *   userSetVols: user set volumes {Object} = {
 *     "kovan.dnp.dappnode.eth": {
 *       "kovan:/root/.local/share/io.parity.ethereum/": "different_name"
 *     }, ... }
 *   userSetPorts: user set ports {Object} = {
 *     "kovan.dnp.dappnode.eth": {
 *       "30303": "31313:30303",
 *       "30303/udp": "31313:30303/udp"
 *     }, ... }
 *   logId: task id {String}
 * }
 * @return {Object} A formated success message.
 * result: empty
 */
const installPackage = async ({
  id,
  userSetVols = {},
  userSetPorts = {},
  logId,
  options = {},
}) => {
  // 1. Parse the id into a request
  // id = 'otpweb.dnp.dappnode.eth@0.1.4'
  // req = { name: 'otpweb.dnp.dappnode.eth', ver: '0.1.4' }
  const req = parse.packageReq(id);

  // If the request is not from IPFS, check if the chain is syncing
  if (!isIpfsRequest(req) && await isSyncing()) {
    throw Error('Mainnet is syncing');
  }

  // 2. Resolve the request
  let result;
  if (options.BYPASS_RESOLVER) {
    /**
     * The dappGet resolver may cause errors.
     * Updating the core will never require dependency resolution,
     * therefore for a system update the dappGet resolver will be emitted
     *
     * If BYPASS_RESOLVER == true, just fetch the first level dependencies of the request
     */
    const reqManifest = await getManifest(req);
    // reqManifest.dependencies = {
    //     'bind.dnp.dappnode.eth': '0.1.4',
    //     'admin.dnp.dappnode.eth': '/ipfs/Qm...',
    // }

    // Append dependencies in the list of packages to install
    result = {
      success: (reqManifest || {}).dependencies || {},
      state: {},
    };
    // Add current request to packages to install
    result.success[req.name] = req.ver;

    // The function below does not directly affect funcionality.
    // However it would prevent already installed packages from installing
    try {
      (await dockerList.listContainers()).forEach((pkg) => {
        if (pkg.name && pkg.version
          && result.success && result.success[pkg.name]
          && result.success[pkg.name] === pkg.version) {
            delete result.success[pkg.name];
          }
      });
    } catch (e) {
      logs.error('Error listing current containers: '+e);
    }
  } else {
    /**
     * If BYPASS_RESOLVER == false, use the resolver
     */
    try {
      await dappGet.update(req);
    } catch (e) {
      throw Error(`Error updating DNP repo: ${e.stack || e.message}`);
    }
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
    let manifest = await getManifest({name, ver});
    if (!manifest) throw Error('Missing manifest for '+name);

    // 3.3 Verify dncore condition
    // Prevent default values. Someone can try to spoof "isCore" in the manifest
    manifest.isCore = false;
    if (manifest.type == 'dncore') {
      if (options.BYPASS_CORE_RESTRICTION) {
        manifest.isCore = true;
      } else if (
        // The origin must be the registry controlled by the DAppNode team,
        // and it must NOT come from ipfs, thus APM
        name.endsWith('.dnp.dappnode.eth') && !ver.startsWith('/ipfs/')
      ) {
        manifest.isCore = true;
      } else {
        throw Error(`Unverified core package ${name}, only allowed origin is .dnp.dappnode.eth APM registy`);
      }
    }

    // 3.4 Merge user set vols and ports
    manifest = merge.manifest.vols(manifest, userSetVols);
    manifest = merge.manifest.ports(manifest, userSetPorts);

    // Return pkg object
    return {
      name,
      ver,
      manifest,
    };
  }));

  // 4. Download requested packages
  await Promise.all(pkgs.map((pkg) => packages.download({pkg, logId})));

  // 5. Run requested packages
  // Patch, install the dappmanager the last always
  const isDappmanager = (pkg) => pkg.manifest && pkg.manifest.name
    && pkg.manifest.name.includes('dappmanager.dnp.dappnode.eth');

  await Promise.all(pkgs
    .filter((pkg) => !isDappmanager(pkg))
    .map((pkg) => packages.run({pkg, logId}))
  );

  const dappmanagerPkg = pkgs.find(isDappmanager);
  if (dappmanagerPkg) {
    await packages.run({pkg: dappmanagerPkg, logId});
  }

  // 6. P2P ports: modify docker-compose + open ports
  // - lockPorts modifies the docker-compose and returns
  //   portsToOpen = [ {number: 32769, type: 'UDP'}, ... ]
  // - managePorts calls UPnP to open the ports

  await Promise.all(pkgs.map(async (pkg) => {
    const portsToOpen = await lockPorts(pkg);
    // Abort if there are no ports to open
    // Don't attempt to call UPnP if not necessary
    if (portsToOpen.length && await shouldOpenPorts()) {
      const kwargs = {action: 'open', ports: portsToOpen};
      eventBus.emit(eventBusTag.call, {callId: 'managePorts', kwargs});
    }
  }));

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: 'Installed ' + req.req,
    logMessage: true,
    userAction: true,
  };
};


module.exports = installPackage;
