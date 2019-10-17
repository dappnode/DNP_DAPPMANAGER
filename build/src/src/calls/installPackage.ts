import fs from "fs";
import * as eventBus from "../eventBus";
// Modules
import dappGet from "../modules/dappGet";
import getImage, { verifyDockerImage } from "../modules/release/getImage";
import lockPorts from "../modules/lockPorts";
import {
  dockerLoad,
  dockerCleanOldImages,
  dockerComposeDown
} from "../modules/docker/dockerCommands";
import { dockerComposeUpSafe } from "../modules/docker/dockerSafe";
import restartPatch from "../modules/docker/restartPatch";
import getRelease from "../modules/release/getRelease";
import orderInstallPackages from "../modules/installer/orderInstallPackages";
import getInstallerPackageData from "../modules/installer/getInstallerPackageData";
import writeAndValidateCompose from "../modules/installer/writeAndValidateCompose";
// Utils
import { writeManifest } from "../utils/manifestFile";
import { convertUserSetLegacy } from "../utils/dockerComposeParsers";
import { logUi, logUiClear } from "../utils/logUi";
import * as parse from "../utils/parse";
import { isIpfsRequest } from "../utils/validate";
import * as validate from "../utils/validate";
import isSyncing from "../utils/isSyncing";
import {
  RpcHandlerReturn,
  UserSetPackageEnvs,
  UserSetPackageVols,
  UserSetPackagePorts,
  InstallPackageData,
  UserSet
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
 * The logId is the requested id. It is used for the UI to track
 * the progress of the installation in real time and prevent double installs
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

  const BYPASS_CORE_RESTRICTION = Boolean(
    options && options.BYPASS_CORE_RESTRICTION
  );

  // Legacy
  const userSetByDnp: { [dnpName: string]: UserSet } = convertUserSetLegacy({
    userSetEnvs,
    userSetVols,
    userSetPorts
  });

  // 1. Parse the id into a request
  // id = 'otpweb.dnp.dappnode.eth@0.1.4'
  // req = { name: 'otpweb.dnp.dappnode.eth', ver: '0.1.4' }
  const req = parse.packageReq(id);

  // If the request is not from IPFS, check if the chain is syncing
  if (!isIpfsRequest(req) && (await isSyncing()))
    throw Error("Mainnet is syncing");

  /**
   * [Resolve] the request
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
    `Resolved request ${id} ver ${req.ver}: ${JSON.stringify(state, null, 2)}`
  );

  // 3. Format the request and filter out already updated packages
  for (const name in alreadyUpdated)
    logUi({ id, name, message: "Already updated" });

  /**
   * [Data] gather all data for the following steps.
   * This is an isolated function to ease testing
   */
  const packagesData: InstallPackageData[] = orderInstallPackages(
    await Promise.all(
      Object.entries(state).map(async ([name, version]) => {
        const release = await getRelease(name, version);

        // .origin is only false when the origin is the AragonAPM
        if (release.warnings.unverifiedCore && !BYPASS_CORE_RESTRICTION)
          throw Error(`Core package ${name} is from an unverified origin`);

        const userSet = userSetByDnp[name] || {};
        const packageData = getInstallerPackageData(release, userSet);
        const { composeNextPath, compose } = packageData;

        // Create the repoDir if necessary
        validate.path(composeNextPath);
        await writeAndValidateCompose(composeNextPath, compose);

        return packageData;
      })
    ),
    req.name
  );
  logs.debug(`Packages data: ${JSON.stringify(packagesData, null, 2)}`);

  /**
   * [Download] The image of each package to the file system in paralel
   */
  await Promise.all(
    packagesData.map(async function(pkg) {
      const { name, version, isCore, imageFile, imagePath } = pkg;
      logUi({ id, name, message: "Starting download..." });

      function onProgress(progress: number): void {
        let message = `Downloading ${progress}%`;
        if (progress > 100) message += ` (expected ${imageFile.size} bytes)`;
        logUi({ id, name, message });
      }
      await getImage(imageFile, imagePath, onProgress).catch((e: Error) => {
        e.message = `Can't download ${name} image: ${e.message}`;
        throw e; // Use this format to keep the stack trace
      });

      // Do not throw for core packages
      try {
        await verifyDockerImage({ imagePath, name, version });
      } catch (e) {
        const errorMessage = `Error verifying image: ${e.message}`;
        if (isCore) logs.error(errorMessage);
        else throw Error(errorMessage);
      }

      logUi({ id, name, message: "Package downloaded" });
    })
  );

  /**
   * [Load] Docker image from .tar.xz. Do this after all downloads after uping
   * any package to prevent inconsistencies. If a dependency fails, some
   * future version of another DNP could be loaded creating wierd bugs of unstable versions
   */
  await Promise.all(
    packagesData.map(async function({ name, imagePath }) {
      logUi({ id, name, message: "Loading image..." });
      await dockerLoad(imagePath);
      logUi({ id, name, message: "Package Loaded" });
    })
  );

  try {
    /**
     * [Run] Up each package in serie. The order is extremely important
     * and is guaranteed by `orderInstallPackages`
     */
    for (const { name, version, composeNextPath } of packagesData) {
      logUi({ id, name, message: "Starting package... " });

      // patch to prevent installer from crashing
      if (name == "dappmanager.dnp.dappnode.eth")
        await restartPatch(name + ":" + version);
      else await dockerComposeUpSafe(composeNextPath);

      logUi({ id, name, message: "Package started" });
    }
  } catch (e) {
    logs.error(`Rolling back installation of ${id}: ${e.stack}`);
    /**
     * Rollback
     * - Stop all new packages with the new compose
     * - Up the old packages with the previous compose
     */
    for (const {
      name,
      imagePath,
      composePath,
      composeNextPath
    } of packagesData) {
      try {
        logUi({ id, name, message: "Aborting and rolling back..." });

        try {
          if (fs.existsSync(composeNextPath))
            await dockerComposeDown(composeNextPath);
        } catch (eDown) {
          logs.error(`Error on rollback dc down ${name}: ${eDown.stack}`);
        }

        safeUnlink(imagePath);
        safeUnlink(composeNextPath);

        // Deal with packages that were NOT installed before this install
        if (fs.existsSync(composePath)) await dockerComposeUpSafe(composePath);
      } catch (ePkg) {
        logs.error(`Error rolling back ${name}: ${ePkg.stack}`);
      }
    }

    // Emit packages update
    eventBus.requestPackages.emit();

    throw e;
  }

  /**
   * [Clean] old files and images
   * IMPORTANT! Do this step AFTER the try/catch otherwise the rollback
   * will not work, as the compose.next.yml is the same as compose.yml
   */
  for (const pkg of packagesData) {
    const { name, version, imagePath } = pkg;
    const { composePath, composeNextPath } = pkg;

    logUi({ id, name, message: "Cleaning files..." });
    fs.unlinkSync(imagePath);
    fs.renameSync(composeNextPath, composePath);

    logUi({ id, name, message: "cleaning old images" });
    await dockerCleanOldImages(name, version).catch(e =>
      logs.warn(`Error cleaning images: ${e.message}`)
    );
  }

  /**
   * [Files] Add remaining files
   * [Clean] old files and images
   */
  for (const pkg of packagesData) {
    const { name, manifestPath, metadata } = pkg;
    logUi({ id, name, message: "Writing files..." });

    writeManifest(manifestPath, metadata);
  }

  /**
   * [Lock] Call lock ephemeral ports: modify docker-compose + open ports
   * lockPorts modifies the docker-compose and returns
   */
  for (const { name } of packagesData) {
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

// Utils

function safeUnlink(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    logs.error(
      `Error on installer rollback safeUnlink of ${filePath}: ${e.stack}`
    );
  }
}
