import { eventBus, eventBusTag } from "../eventBus";
// Modules
import * as packages from "../modules/packages";
import dappGet from "../modules/dappGet";
import getManifest from "../modules/getManifest";
import lockPorts from "../modules/lockPorts";
// Utils
import logUi from "../utils/logUi";
import * as parse from "../utils/parse";
import * as merge from "../utils/merge";
import isIpfsRequest from "../utils/isIpfsRequest";
import isSyncing from "../utils/isSyncing";
import * as envsHelper from "../utils/envsHelper";
import {
  UserSetPackageEnvs,
  UserSetPackagePorts,
  UserSetPackageVols,
  InstallerPkg
} from "../types";
import Logs from "../logs";
const logs = Logs(module);

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
 * @param {string} id DNP .eth name
 * @param {object} userSetEnvs
 * userSetEnvs= {
 *   "kovan.dnp.dappnode.eth": {
 *     "ENV_NAME": "VALUE1"
 * }, ... }
 * @param {object} userSetVols user set volumes
 * userSetVols = {
 *   "kovan.dnp.dappnode.eth": {
 *     "kovan:/root/.local/share/io.parity.ethereum/": "different_name"
 * }, ... }
 * @param {object} userSetPorts user set ports
 * userSetPorts = {
 *   "kovan.dnp.dappnode.eth": {
 *     "30303": "31313:30303",
 *     "30303/udp": "31313:30303/udp"
 * }, ... }
 * @param {object} options install options
 * - BYPASS_RESOLVER {bool}: Skips dappGet and just fetches first level dependencies
 * - BYPASS_CORE_RESTRICTION {bool}: Allows dncore DNPs from unverified sources (IPFS)
 * options = { BYPASS_RESOLVER: true, BYPASS_CORE_RESTRICTION: true }
 */
export default async function installPackage({
  id,
  userSetEnvs,
  userSetVols,
  userSetPorts,
  options
}: {
  id: string;
  userSetEnvs?: UserSetPackageEnvs;
  userSetVols?: UserSetPackageVols;
  userSetPorts?: UserSetPackagePorts;
  options?: { BYPASS_CORE_RESTRICTION?: boolean; BYPASS_RESOLVER?: boolean };
}) {
  if (!id) throw Error("kwarg id must be defined");

  const BYPASS_CORE_RESTRICTION = options && options.BYPASS_CORE_RESTRICTION;

  /**
   * The logId is the requested id.
   * - Doesn't require the generation of a random number
   * - Two install calls of the same DNP will be bundled in the userActionLogs
   * - The progressLogs in the UI will know which DNP triggered them
   */

  // 1. Parse the id into a request
  // id = 'otpweb.dnp.dappnode.eth@0.1.4'
  // req = { name: 'otpweb.dnp.dappnode.eth', ver: '0.1.4' }
  const req = parse.packageReq(id);

  // If the request is not from IPFS, check if the chain is syncing
  if (!isIpfsRequest(req) && (await isSyncing())) {
    throw Error("Mainnet is syncing");
  }

  /**
   * 2. Resolve the request
   * @param {object} state = {
   * 'admin.dnp.dappnode.eth': '0.1.5'
   * }
   * @param {object} alreadyUpdated = {
   * 'bind.dnp.dappnode.eth': '0.1.4'
   * }
   * Forwards the options to dappGet:
   * - BYPASS_RESOLVER: if true, uses the dappGetBasic, which only fetches first level deps
   */
  logUi({ id, name: req.name, message: "Resolving dependencies..." });
  const { state, alreadyUpdated } = await dappGet(req, options);

  logs.info(
    `Resolved request ${id} ver ${req.ver}:\n ${JSON.stringify(state, null, 2)}`
  );

  // 3. Format the request and filter out already updated packages
  Object.keys(alreadyUpdated || {}).forEach(name => {
    logUi({ id, name, message: "Already updated" });
  });

  const pkgs: InstallerPkg[] = await Promise.all(
    Object.entries(state).map(async ([name, ver]) => {
      // 3.2 Fetch manifest
      let manifest = await getManifest({ name, ver });
      if (!manifest) throw Error(`Missing manifest for ${name}`);

      // 3.3 Verify dncore condition
      // Prevent default values. Someone can try to spoof "isCore" in the manifest
      // The origin must be the registry controlled by the DAppNode team, and it must NOT come from ipfs, thus APM
      if (
        manifest.type == "dncore" &&
        !BYPASS_CORE_RESTRICTION &&
        (!(name || "").endsWith(".dnp.dappnode.eth") ||
          (ver || "").startsWith("/ipfs/"))
      )
        throw Error(
          `Unverified core package ${name}, only allowed origin is .dnp.dappnode.eth APM registy`
        );

      // 3.4 Merge user set vols and ports
      if (userSetVols) manifest = merge.manifest.vols(manifest, userSetVols);
      if (userSetPorts) manifest = merge.manifest.ports(manifest, userSetPorts);

      // Return pkg object
      return { name, ver, manifest, isCore: manifest.type == "dncore" };
    })
  );
  const dnpNames = pkgs.map(({ name }) => name).join(", ");
  logs.debug(`Processed manifests for: ${dnpNames}`);
  logs.debug(JSON.stringify(pkgs, null, 2));

  // 4. Download requested packages in paralel
  await Promise.all(pkgs.map(pkg => packages.download({ pkg, id })));
  logs.info(`Successfully downloaded DNPs ${dnpNames}`);

  // 5. Load requested packages in paralel
  //    Do this in a separate stage. If the download fails, the files will not be persisted
  //    If a dependency fails, some future version of another DNP could be loaded
  //    creating wierd bugs of unstable versions
  //    ###### NOTE: this a temporary solution until a proper rollback is implemented
  await Promise.all(pkgs.map(pkg => packages.load({ pkg, id })));
  logs.info(`Successfully loaded DNPs ${dnpNames}`);

  // Patch, install the dappmanager the last always
  const isDappmanager = (pkg: InstallerPkg) =>
    (pkg.manifest || {}).name === "dappmanager.dnp.dappnode.eth";

  for (const pkg of pkgs.sort(pkg => (isDappmanager(pkg) ? 1 : -1))) {
    // 5. Set ENVs. Set userSetEnvs + the manifest defaults (if not previously set)
    const name = pkg.manifest.name;
    const defaultEnvs = envsHelper.getManifestEnvs(pkg.manifest) || {};
    const previousEnvs = envsHelper.load(name, pkg.isCore) || {};
    const _userSetEnvs =
      userSetEnvs && userSetEnvs[pkg.manifest.name]
        ? userSetEnvs[pkg.manifest.name]
        : {};
    /**
     * Merge ENVs by priority
     * 1. userSet on installation
     * 2. previously set (already installed DNPs)
     * 3. default values from the manifest
     * Empty values will NOT be replaced on updates.
     */
    const envs = { ...defaultEnvs, ...previousEnvs, ..._userSetEnvs };
    envsHelper.write(name, pkg.isCore, envs);
    logs.info(
      `Wrote envs for DNP ${name} ${
        pkg.isCore ? "(Core)" : ""
      }:\n ${JSON.stringify(envs, null, 2)}`
    );

    // 6. Run requested packages
    await packages.run({ pkg, id });
    logs.info(`Started (docker-compose up) DNP ${pkg.name}`);

    // 7. Lock ephemeral ports: modify docker-compose + open ports
    // - lockPorts modifies the docker-compose and returns
    //   lockedPortsToOpen = [ {portNumber: '32769', protocol: 'UDP'}, ... ]
    await lockPorts(pkg.name || pkg.manifest.name);
  }

  // Instruct the UI to clear isInstalling logs
  logUi({ id, clear: true });

  // AFTER - 8. Trigger a natRenewal update to open ports if necessary
  // Since a package installation is not a very frequent activity it is okay to be
  // called on each install. Internal mechanisms protect the natRenewal function
  // to be called too often.
  eventBus.emit(eventBusTag.runNatRenewal);

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);
  eventBus.emit(eventBusTag.packageModified);

  return {
    message: `Installed ${req.req}`,
    logMessage: true,
    userAction: true
  };
}
