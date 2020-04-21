import fs from "fs";
import path from "path";
import params from "../params";
import * as eventBus from "../eventBus";
import * as db from "../db";
// Modules
import getImage, { verifyDockerImage } from "../modules/release/getImage";
import lockPorts from "../modules/lockPorts";
import {
  dockerLoad,
  dockerCleanOldImages
} from "../modules/docker/dockerCommands";
import { dockerComposeUpSafe } from "../modules/docker/dockerSafe";
import restartPatch from "../modules/docker/restartPatch";
import orderInstallPackages from "../modules/installer/orderInstallPackages";
import getInstallerPackageData from "../modules/installer/getInstallerPackageData";
import writeAndValidateCompose from "../modules/installer/writeAndValidateCompose";
import createCustomVolumeDevicePaths from "../modules/installer/createCustomVolumeDevicePaths";
// Utils
import { writeManifest } from "../utils/manifestFile";
import { logUi, logUiClear } from "../utils/logUi";
import * as validate from "../utils/validate";
import { RpcHandlerReturn, InstallPackageData, PackageRequest } from "../types";
import { RequestData } from "../route-types/installPackage";
import Logs from "../logs";
import copyFileTo from "./copyFileTo";
import { sanitizeRequestName, sanitizeRequestVersion } from "../utils/sanitize";
import {
  packageIsInstalling,
  flagPackagesAreNotInstalling,
  flagPackagesAreInstalling
} from "../utils/packageIsInstalling";
import { stringify } from "../utils/objects";
import { ReleaseFetcher } from "../modules/release";
const logs = Logs(module);

const dappmanagerId = params.dappmanagerDnpName;

/**
 * Installs a DAppNode Package.
 * Resolves dependencies, downloads release assets, loads the images to docker,
 * sets userSettings and starts the docker container for each package.
 *
 * The logId is the requested id. It is used for the UI to track the progress
 * of the installation in real time and prevent double installs
 *
 * Options
 * - BYPASS_RESOLVER {bool}: Skips dappGet to only fetche first level dependencies
 * - BYPASS_CORE_RESTRICTION {bool}: Allows unverified core DNPs (from IPFS)
 */
export default async function installPackage({
  name: reqName,
  version: reqVersion,
  userSettings: userSettingsAllDnps = {},
  options
}: RequestData): RpcHandlerReturn {
  const BYPASS_CORE_RESTRICTION = Boolean(
    options && options.BYPASS_CORE_RESTRICTION
  );

  // 1. Parse the id into a request
  reqName = sanitizeRequestName(reqName);
  reqVersion = sanitizeRequestVersion(reqVersion);
  const req: PackageRequest = { name: reqName, ver: reqVersion };
  const id = reqName;

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
  logUi({ id, name: reqName, message: "Resolving dependencies..." });
  const releaseFetcher = new ReleaseFetcher();
  const {
    state,
    alreadyUpdated,
    releases
  } = await releaseFetcher.getReleasesResolved(req, options);
  logs.info(`Resolved request ${reqName} @ ${reqVersion}: ${stringify(state)}`);

  // Make sure that all packages are not being installed
  for (const dnpName of Object.keys(state))
    if (packageIsInstalling(dnpName)) {
      logUiClear({ id }); // Clear "resolving..." logs
      throw Error(`${dnpName} is installing`);
    }

  try {
    // Flag the packages as installing
    flagPackagesAreInstalling(state);

    // 3. Format the request and filter out already updated packages
    for (const name in alreadyUpdated)
      logUi({ id, name, message: "Already updated" });

    /**
     * [Data] gather all data for the following steps.
     * This is an isolated function to ease testing
     */
    const packagesData: InstallPackageData[] = orderInstallPackages(
      await Promise.all(
        Object.entries(releases).map(async ([name, release]) => {
          // .origin is only false when the origin is the AragonAPM
          if (release.warnings.unverifiedCore && !BYPASS_CORE_RESTRICTION)
            throw Error(`Core package ${name} is from an unverified origin`);

          const userSettings = userSettingsAllDnps[name] || {};
          const packageData = getInstallerPackageData(release, userSettings);
          const { composeNextPath, compose } = packageData;

          logs.debug(`Package data: ${JSON.stringify(packageData, null, 2)}`);
          logs.debug(`User settings: ${JSON.stringify(userSettings, null, 2)}`);

          validate.path(composeNextPath); // Create the repoDir if necessary
          await writeAndValidateCompose(composeNextPath, compose);

          return packageData;
        })
      ),
      reqName
    );
    // Bulk packages processing
    // Create custom volume device path if any
    await createCustomVolumeDevicePaths(
      packagesData.map(({ compose }) => compose)
    );

    /**
     * [Download] The image of each package to the file system in paralel
     */
    await Promise.all(
      packagesData.map(async function(pkg) {
        const { name, semVersion, isCore, imageFile, imagePath } = pkg;
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
          await verifyDockerImage({ imagePath, name, version: semVersion });
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
      for (const { name, composeNextPath, fileUploads } of packagesData) {
        // patch to prevent installer from crashing
        if (name == dappmanagerId) {
          logUi({ id, name, message: "Reseting DAppNode... " });
          await restartPatch();
        } else {
          // Copy fileUploads if any to the container before up-ing
          if (fileUploads) {
            logUi({ id, name, message: "Copying file uploads..." });
            logs.debug(`${name} fileUploads: ${JSON.stringify(fileUploads)}`);

            await dockerComposeUpSafe(composeNextPath, { noStart: true });
            for (const [containerPath, dataUri] of Object.entries(
              fileUploads
            )) {
              const { dir, base } = path.parse(containerPath);
              await copyFileTo({
                id: name,
                dataUri,
                filename: base,
                toPath: dir
              });
            }
          }

          logUi({ id, name, message: "Starting package... " });
          await dockerComposeUpSafe(composeNextPath);
        }

        logUi({ id, name, message: "Package started" });
      }
    } catch (e) {
      /**
       * [Rollback] Stop all new packages with the new compose
       * Up the old packages with the previous compose
       */
      logs.error(`Rolling back installation of ${id}: ${e.stack}`);
      for (const {
        name,
        imagePath,
        composePath,
        composeNextPath
      } of packagesData) {
        try {
          logUi({ id, name, message: "Aborting and rolling back..." });

          safeUnlink(imagePath);
          safeUnlink(composeNextPath);

          // Deal with packages that were NOT installed before this install
          if (fs.existsSync(composePath) && name !== dappmanagerId)
            await dockerComposeUpSafe(composePath);
        } catch (ePkg) {
          logs.error(`Error rolling back ${name}: ${ePkg.stack}`);
        }
      }

      // Instruct the UI to clear isInstalling logs
      logUiClear({ id });

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
      const { name, semVersion, imagePath } = pkg;
      const { composePath, composeNextPath } = pkg;

      logUi({ id, name, message: "Cleaning files..." });
      fs.unlinkSync(imagePath);
      fs.renameSync(composeNextPath, composePath);

      logUi({ id, name, message: "cleaning old images" });
      await dockerCleanOldImages(name, semVersion).catch(e =>
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
      db.addPackageInstalledMetadata(name);
    }

    /**
     * [Lock] Call lock ephemeral ports: modify docker-compose + open ports
     * lockPorts modifies the docker-compose and returns
     */
    for (const { name } of packagesData) {
      logUi({ id, name, message: "Locking ports..." });
      await lockPorts(name);
      logUi({ id, name, message: "Locked ports" });
    }

    // Instruct the UI to clear isInstalling logs
    logUiClear({ id });

    /**
     * [NAT-RENEWAL] Trigger a natRenewal update to open ports if necessary
     * Since a package installation is not a very frequent activity it is okay to be
     * called on each install. Internal mechanisms protect the natRenewal function
     * to be called too often.
     */
    eventBus.runNatRenewal.emit();

    // Emit packages update
    eventBus.requestPackages.emit();
    eventBus.packagesModified.emit({
      ids: packagesData.map(({ name }) => name)
    });

    // Flag packages as no longer installing
    flagPackagesAreNotInstalling(state);

    return {
      message: `Installed ${id}`,
      logMessage: true,
      userAction: true
    };
  } catch (e) {
    // CRITICAL STEP: Flag the packages as NOT installing
    // Otherwise packages will not be able to be installed
    flagPackagesAreNotInstalling(state);

    // Clear possible logs between dep resolution and package running
    logUiClear({ id });

    throw e;
  }
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
