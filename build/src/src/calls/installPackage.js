const {eventBus, eventBusTag} = require('eventBus');
const logs = require('logs.js')(module);
const db = require('../db');
// Modules
const packages = require('modules/packages');
const dappGet = require('modules/dappGet');
const dappGetBasic = require('modules/dappGet/basic');
const getManifest = require('modules/getManifest');
const lockPorts = require('modules/lockPorts');
// Utils
const logUI = require('utils/logUI');
const parse = require('utils/parse');
const merge = require('utils/merge');
const isIpfsRequest = require('utils/isIpfsRequest');
const isSyncing = require('utils/isSyncing');
const envsHelper = require('utils/envsHelper');
const parseManifestPorts = require('utils/parseManifestPorts');

/* eslint-disable max-len */

//  userSetEnvs = {
//    "kovan.dnp.dappnode.eth": {
//      "ENV_NAME": "VALUE1"
//    }, ... }
//  userSetVols = "kovan.dnp.dappnode.eth": {
//      "old_path:/root/.local": "new_path:/root/.local"
//    }, ... }
//  userSetPorts = {
//    "kovan.dnp.dappnode.eth": {
//      "30303": "31313:30303",
//      "30303/udp": "31313:30303/udp"
//    }, ... }

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
 *   userSetEnvs = {
 *     "kovan.dnp.dappnode.eth": {
 *       "ENV_NAME": "VALUE1"
 *     }, ... }
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
const installPackage = async ({id, userSetEnvs = {}, userSetVols = {}, userSetPorts = {}, logId, options = {}}) => {
  // 1. Parse the id into a request
  // id = 'otpweb.dnp.dappnode.eth@0.1.4'
  // req = { name: 'otpweb.dnp.dappnode.eth', ver: '0.1.4' }
  const req = parse.packageReq(id);

  // If the request is not from IPFS, check if the chain is syncing
  if (!isIpfsRequest(req) && (await isSyncing())) {
    throw Error('Mainnet is syncing');
  }

  // 2. Resolve the request
  // result = {
  //     success: {'bind.dnp.dappnode.eth': '0.1.4'}
  //     alreadyUpdated: {'bind.dnp.dappnode.eth': '0.1.2'}
  // }
  const result = options.BYPASS_RESOLVER ? await dappGetBasic(req) : await dappGet(req);
  // Return error if the req couldn't be resolved
  if (!result.success) {
    const errorMessage = `Request ${req.name}@${req.ver} could not be resolved: ${result.message}`;
    if (result.e) {
      result.e.message = errorMessage;
      throw result.e;
    } else {
      throw Error(errorMessage);
    }
  }
  logs.debug(`Successfully resolved req ${JSON.stringify(req)}:\n ${JSON.stringify(result, null, 2)}`);

  // 3. Format the request and filter out already updated packages
  Object.keys(result.alreadyUpdated || {}).forEach((name) => {
    logUI({logId, name, msg: 'Already updated'});
  });

  let pkgs = await Promise.all(
    Object.keys(result.success).map(async (name) => {
      // 3.2 Fetch manifest
      const ver = result.success[name];
      let manifest = await getManifest({name, ver});
      if (!manifest) throw Error('Missing manifest for ' + name);

      // 3.3 Verify dncore condition
      // Prevent default values. Someone can try to spoof "isCore" in the manifest
      // The origin must be the registry controlled by the DAppNode team, and it must NOT come from ipfs, thus APM
      if (manifest.type == 'dncore') {
        if (!options.BYPASS_CORE_RESTRICTION && (!name.endsWith('.dnp.dappnode.eth') || ver.startsWith('/ipfs/'))) {
          throw Error(`Unverified core package ${name}, only allowed origin is .dnp.dappnode.eth APM registy`);
        }
        manifest.isCore = true;
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
    })
  );
  logs.debug(`Processed manifests for: ${pkgs.map(({name}) => name).join(', ')}`);

  // 4. Download requested packages in paralel
  await Promise.all(pkgs.map((pkg) => packages.download({pkg, logId})));
  logs.debug(`Successfully downloaded DNPs ${pkgs.map(({name}) => name).join(', ')}`);

  // Patch, install the dappmanager the last always
  const isDappmanager = (pkg) => (pkg.manifest.name || '').includes('dappmanager.dnp.dappnode.eth');
  for (const pkg of pkgs.sort((pkg) => (isDappmanager(pkg) ? 1 : -1))) {
    // 5. Set ENVs. Set userSetEnvs + the manifest defaults (if not previously set)
    const {name, isCore} = pkg.manifest;
    const defaultEnvs = envsHelper.getManifestEnvs(pkg.manifest);
    const previousEnvs = envsHelper.load(name, isCore);
    const envs = {...defaultEnvs, ...previousEnvs, ...userSetEnvs[pkg.manifest.name]};
    envsHelper.write(name, isCore, envs);
    logs.debug(`Wrote envs for DNP ${name} ${isCore ? '(Core)' : ''}:\n ${JSON.stringify(envs, null, 2)}`);

    // 6. Run requested packages
    await packages.run({pkg, logId});
    logs.debug(`Started (docker-compose up) DNP ${pkg.name}`);

    // 7. Open ports
    // 7A. Mapped ports: mappedPortsToOpen = [ {number: '30303', type: 'TCP'}, ... ]
    const mappedPortsToOpen = parseManifestPorts(pkg.manifest);

    // 7B. P2P ports: modify docker-compose + open ports
    // - lockPorts modifies the docker-compose and returns
    //   lockedPortsToOpen = [ {number: '32769', type: 'UDP'}, ... ]
    // - managePorts calls UPnP to open the ports
    const lockedPortsToOpen = await lockPorts({pkg});
    logs.debug(`Locked ${lockedPortsToOpen.length} ports of DNP ${pkg.name}: ${JSON.stringify(lockedPortsToOpen)}`);

    // Skip if there are no ports to open or if UPnP is not available
    const portsToOpen = [...mappedPortsToOpen, ...lockedPortsToOpen];
    const upnpAvailable = await db.get('upnpAvailable');
    if (portsToOpen.length && upnpAvailable) {
      eventBus.emit(eventBusTag.call, {
        callId: 'managePorts',
        kwargs: {
          action: 'open',
          ports: portsToOpen,
        },
      });
      logs.debug(`Emitted internal call to open ports: ${JSON.stringify(portsToOpen)}`);
    }
  }

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);
  eventBus.emit(eventBusTag.packageModified);

  return {
    message: 'Installed ' + req.req,
    logMessage: true,
    userAction: true,
  };
};

module.exports = installPackage;
