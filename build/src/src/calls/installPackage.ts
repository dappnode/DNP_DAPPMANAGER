import path from "path";
import fs from "fs";
import params from "../params";
import * as eventBus from "../eventBus";
// Modules
import dappGet from "../modules/dappGet";
import getRelease from "../modules/release/getRelease";
import getImage from "../modules/release/getImage";
import lockPorts from "../modules/lockPorts";
import {
  dockerLoad,
  dockerCleanOldImages
} from "../modules/docker/dockerCommands";
import { dockerComposeUpSafeByName } from "../modules/docker/dockerSafe";
import restartPatch from "../modules/docker/restartPatch";
// Utils
import { logUi, logUiClear } from "../utils/logUi";
import * as parse from "../utils/parse";
import { writeConfigFiles } from "../utils/configFiles";
import isIpfsRequest from "../utils/isIpfsRequest";
import isSyncing from "../utils/isSyncing";
import {
  UserSetPackageEnvs,
  UserSetPackagePorts,
  UserSetPackageVols,
  InstallerPkg,
  RpcHandlerReturn
} from "../types";
import Logs from "../logs";
const logs = Logs(module);

const imageDir = params.TEMP_TRANSFER_DIR;

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
}): Promise<RpcHandlerReturn> {
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
  Object.keys(alreadyUpdated || {}).forEach(function(name) {
    logUi({ id, name, message: "Already updated" });
  });

  const pkgs: InstallerPkg[] = await Promise.all(
    Object.entries(state).map(async ([name, version]) => {
      // 3.2 Fetch manifest
      const release = await getRelease(name, version);

      // 3.3 Verify dncore condition
      // Prevent default values. Someone can try to spoof "isCore" in the manifest
      // The origin must be the registry controlled by the DAppNode team, and it must NOT come from ipfs, thus APM
      if (
        release.isCore &&
        !BYPASS_CORE_RESTRICTION &&
        (!(name || "").endsWith(".dnp.dappnode.eth") ||
          (version || "").startsWith("/ipfs/"))
      )
        throw Error(
          `Unverified core package ${name}, only allowed origin is .dnp.dappnode.eth APM registy`
        );

      return {
        ...release,
        imagePath: path.join(imageDir, `${name}_${version}.tar.xz`)
      };
    })
  );
  const dnpNames = pkgs.map(({ name }) => name).join(", ");
  logs.debug(`Processed manifests for: ${dnpNames}`);
  logs.debug(JSON.stringify(pkgs, null, 2));

  // 4. Download requested packages in paralel
  await Promise.all(
    pkgs.map(async function({ name, imageFile: { hash, size }, imagePath }) {
      logUi({ id, name, message: "Starting download..." });
      await getImage(hash, imagePath, size, (progress: number) => {
        let message = `Downloading ${progress}%`;
        if (progress > 100) message += ` (expected ${size} bytes)`;
        logUi({ id, name, message });
      }).catch((e: Error) => {
        e.message = `Can't download ${name} image: ${e.message}`;
        throw e; // Use this format to keep the stack trace
      });

      logUi({ id, name, message: "Package downloaded" });
    })
  );

  // 5. Load requested packages in paralel
  //    Do this in a separate stage. If the download fails, the files will not be persisted
  //    If a dependency fails, some future version of another DNP could be loaded
  //    creating wierd bugs of unstable versions
  //    ###### NOTE: this a temporary solution until a proper rollback is implemented
  await Promise.all(
    pkgs.map(async function({ name, imagePath }) {
      logUi({ id, name, message: "Loading image..." });
      await dockerLoad(imagePath);
      logUi({ id, name, message: "Cleaning files..." });
      fs.unlinkSync(imagePath);
      logUi({ id, name, message: "Package Loaded" });
    })
  );

  // Patch, install the dappmanager the last always
  const pkgsInSafeOrder = pkgs.sort(pkg =>
    pkg.name === "dappmanager.dnp.dappnode.eth" ? 1 : -1
  );

  for (const pkg of pkgsInSafeOrder) {
    // 5. Write configuration files. Metadata, compose, compose-default
    writeConfigFiles({ ...pkg, userSetVols, userSetPorts, userSetEnvs });

    // 6. Run packages
    const { name, version, isCore } = pkg;
    logUi({ id, name, message: "starting package... " });
    // patch to prevent installer from crashing
    if (name == "dappmanager.dnp.dappnode.eth")
      await restartPatch(name + ":" + version);
    else await dockerComposeUpSafeByName(name, isCore);

    logUi({ id, name, message: "cleaning old images" });
    await dockerCleanOldImages(name, version).catch(() => {});

    logUi({ id, name, message: "package started" });

    // 7. Lock ephemeral ports: modify docker-compose + open ports
    // - lockPorts modifies the docker-compose and returns
    //   lockedPortsToOpen = [ {portNumber: '32769', protocol: 'UDP'}, ... ]
    await lockPorts(name);
  }

  // Instruct the UI to clear isInstalling logs
  logUiClear({ id });

  // AFTER - 8. Trigger a natRenewal update to open ports if necessary
  // Since a package installation is not a very frequent activity it is okay to be
  // called on each install. Internal mechanisms protect the natRenewal function
  // to be called too often.
  eventBus.runNatRenewal.emit();

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packageModified.emit({ id });

  return {
    message: `Installed ${req.req}`,
    logMessage: true,
    userAction: true
  };
}
