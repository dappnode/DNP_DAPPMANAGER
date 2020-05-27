import fs from "fs";
import path from "path";
import params from "../params";
import * as eventBus from "../eventBus";
import * as db from "../db";
// Modules
import getImage, { verifyDockerImage } from "../modules/release/getImage";
import {
  dockerLoad,
  dockerCleanOldImages,
  dockerComposeRm
} from "../modules/docker/dockerCommands";
import { dockerComposeUpSafe } from "../modules/docker/dockerSafe";
import { restartDappmanagerPatch } from "../modules/docker/restartPatch";
import orderInstallPackages from "../modules/installer/orderInstallPackages";
import getInstallerPackageData, {
  getInstallerPackagesData
} from "../modules/installer/getInstallerPackageData";
import writeAndValidateCompose from "../modules/installer/writeAndValidateCompose";
import createVolumeDevicePaths from "../modules/installer/createVolumeDevicePaths";
// Utils
import { writeManifest } from "../utils/manifestFile";
import { logUi, logUiClear } from "../utils/logUi";
import * as validate from "../utils/validate";
import { copyFileTo } from "./copyFileTo";
import { sanitizeRequestName, sanitizeRequestVersion } from "../utils/sanitize";
import {
  packageIsInstalling,
  flagPackagesAreNotInstalling,
  flagPackagesAreInstalling
} from "../utils/packageIsInstalling";
import { stringify } from "../utils/objects";
import { ReleaseFetcher } from "../modules/release";
import {
  UserSettingsAllDnps,
  InstallPackageData,
  PackageRequest
} from "../types";
import Logs from "../logs";
const logs = Logs(module);

const dappmanagerId = params.dappmanagerDnpName;
type Log = (name: string, message: string) => void;

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
export async function installPackage({
  name: reqName,
  version: reqVersion,
  userSettings = {},
  options = {}
}: {
  name: string;
  version?: string;
  userSettings?: UserSettingsAllDnps;
  options?: {
    /**
     * Forwarded option to dappGet
     * If true, uses the dappGetBasic, which only fetches first level deps
     */
    BYPASS_RESOLVER?: boolean;
    BYPASS_CORE_RESTRICTION?: boolean;
  };
}): Promise<void> {
  // 1. Parse the id into a request
  const req: PackageRequest = {
    name: sanitizeRequestName(reqName),
    ver: sanitizeRequestVersion(reqVersion)
  };
  const id = req.name;
  const log: Log = (name, message) => logUi({ id, name, message });

  log(id, "Resolving dependencies...");
  const releaseFetcher = new ReleaseFetcher();
  const {
    state,
    currentVersion,
    releases
  } = await releaseFetcher.getReleasesResolved(req, options);
  logs.info(`Resolved request ${req.name} @ ${req.ver}: ${stringify(state)}`);

  // Throw any errors found in the release
  for (const release of releases) {
    if (release.warnings.unverifiedCore && !options.BYPASS_CORE_RESTRICTION)
      throw Error(`Core package ${release.name} is from an unverified origin`);
  }

  // Gather all data necessary for the install. Isolated in a pure function to ease testing
  const packagesData = getInstallerPackagesData({
    releases,
    userSettings,
    currentVersion,
    reqName
  });
  logs.debug(`Packages data: ${JSON.stringify(packagesData, null, 2)}`);
  logs.debug(`User settings: ${JSON.stringify(userSettings, null, 2)}`);

  // Make sure that no package is already being installed
  const dnpNames = packagesData.map(({ name }) => name);
  for (const dnpName of dnpNames)
    if (packageIsInstalling(dnpName)) {
      logUiClear({ id }); // Clear "resolving..." logs
      throw Error(`${dnpName} is installing`);
    }

  try {
    flagPackagesAreInstalling(dnpNames);

    await downloadImages(packagesData, log);
    await loadImages(packagesData, log);

    await createVolumeDevicePaths(packagesData.map(({ compose }) => compose));

    try {
      await runPackages(packagesData, log);
    } catch (e) {
      await rollbackPackages(packagesData, log);
      throw e;
    }

    await postInstallClean(packagesData, log);
    onFinish(id, packagesData);
  } catch (e) {
    onFinish(id, packagesData);
    throw e;
  }
}

/**
 *
 *
 *
 *
 *
 *
 * Experiment to clean up logic, and make it more modular
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

async function onFinish(id: string, packagesData: InstallPackageData[]) {
  const ids = packagesData.map(({ name }) => name);

  /**
   * [NAT-RENEWAL] Trigger a natRenewal update to open ports if necessary
   * Since a package installation is not a very frequent activity it is okay to be
   * called on each install. Internal mechanisms protect the natRenewal function
   * to be called too often.
   */
  eventBus.runNatRenewal.emit();

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ ids });

  // Flag the packages as NOT installing.
  // Must be called also on Error, otherwise packages can't be re-installed
  flagPackagesAreNotInstalling(ids);

  // Instruct the UI to clear isInstalling logs
  logUiClear({ id });
}

async function postInstallClean(packagesData: InstallPackageData[], log: Log) {
  for (const pkg of packagesData) {
    const { name, semVersion, imagePath } = pkg;
    const { composePath, composeBackupPath } = pkg;

    /**
     * [Files] Add remaining files
     * [Clean] old files and images
     */
    const { manifestPath, metadata } = pkg;
    log(name, "Writing files...");

    writeManifest(manifestPath, metadata);
    db.addPackageInstalledMetadata(name);

    /**
     * [Clean] old files and images
     * IMPORTANT! Do this step AFTER the try/catch otherwise the rollback
     * will not work, as the compose.next.yml is the same as compose.yml
     */
    log(name, "Cleaning files...");
    fs.unlinkSync(imagePath);
    fs.unlinkSync(composeBackupPath);

    log(name, "Cleaning previous images...");
    await dockerCleanOldImages(name, semVersion).catch(e =>
      logs.warn(`Error cleaning images: ${e.message}`)
    );
  }
}

/**
 * Download the .tar.xz docker image of each package in paralel
 * After each download verify that the image is ok and contains
 * only the expected image layers
 */
async function downloadImages(packagesData: InstallPackageData[], log: Log) {
  await Promise.all(
    packagesData.map(async function(pkg) {
      const { name, semVersion, isCore, imageFile, imagePath } = pkg;
      log(name, "Starting download...");

      function onProgress(progress: number): void {
        let message = `Downloading ${progress}%`;
        if (progress > 100) message += ` (expected ${imageFile.size} bytes)`;
        log(name, message);
      }

      try {
        await getImage(imageFile, imagePath, onProgress);
      } catch (e) {
        e.message = `Can't download ${name} image: ${e.message}`;
        throw e; // Use this format to keep the stack trace
      }

      // Do not throw for core packages
      log(name, "Verifying download...");
      try {
        await verifyDockerImage({ imagePath, name, version: semVersion });
      } catch (e) {
        const errorMessage = `Error verifying image: ${e.message}`;
        if (isCore) logs.error(errorMessage);
        else throw Error(errorMessage);
      }

      log(name, "Package downloaded");
    })
  );
}

/**
 * Load the docker image .tar.xz. file of each package
 * Do this AFTER all downloads but BEFORE starting any package to prevent inconsistencies.
 * If a dependency fails, some future version of another DNP could be loaded
 * creating wierd bugs with unstable versions
 */
async function loadImages(packagesData: InstallPackageData[], log: Log) {
  await Promise.all(
    packagesData.map(async function({ name, imagePath }) {
      log(name, "Loading image...");
      await dockerLoad(imagePath);
      log(name, "Package Loaded");
    })
  );
}

/**
 * Create and run each package container in series
 * The order is extremely important and should be guaranteed by `orderInstallPackages`
 */
async function runPackages(packagesData: InstallPackageData[], log: Log) {
  for (const { composePath, compose, composeBackupPath } of packagesData) {
    // Create the repoDir if necessary
    validate.path(composePath);

    // Backup compose to be able to do a rollback
    // If the compose does not exist, continue
    if (fs.existsSync(composeBackupPath))
      fs.copyFileSync(composePath, composeBackupPath);

    await writeAndValidateCompose(composePath, compose);
  }

  for (const { name, composePath, fileUploads, ...pkg } of packagesData) {
    // patch to prevent installer from crashing
    if (name == dappmanagerId) {
      log(name, "Reseting DAppNode... ");
      await restartDappmanagerPatch({
        composePath,
        composeBackupPath: pkg.composeBackupPath,
        restartCommand: pkg.metadata.restartCommand,
        restartLaunchCommand: pkg.metadata.restartLaunchCommand
      });
    } else {
      // Copy fileUploads if any to the container before up-ing
      if (fileUploads) {
        log(name, "Copying file uploads...");
        logs.debug(`${name} fileUploads: ${JSON.stringify(fileUploads)}`);

        await dockerComposeUpSafe(composePath, { noStart: true });
        for (const [containerPath, dataUri] of Object.entries(fileUploads)) {
          const { dir: toPath, base: filename } = path.parse(containerPath);
          await copyFileTo({ id: name, dataUri, filename, toPath });
        }
      }

      log(name, "Starting package... ");
      await dockerComposeUpSafe(composePath);
    }

    log(name, "Package started");
  }
}

/**
 * [Rollback] Stop all new packages with the new compose
 * Up the old packages with the previous compose
 */
async function rollbackPackages(packagesData: InstallPackageData[], log: Log) {
  // Restore all backup composes. Do it first to make sure the next version compose is not
  // used unintentionally if the installed package is restored
  for (const { name, composePath, composeBackupPath, isUpdate } of packagesData)
    try {
      fs.copyFileSync(composeBackupPath, composePath);
    } catch (e) {
      if (e.code !== "ENOENT" || isUpdate)
        logs.error(`Rollback error restoring ${name} compose: ${e.stack}`);
    }

  // Delete image files
  for (const { name, imagePath } of packagesData)
    try {
      fs.unlinkSync(imagePath);
    } catch (e) {
      logs.error(`Rollback error removing ${name} image: ${e.stack}`);
    }

  // Restore backup versions
  for (const { name, composePath, isUpdate } of packagesData)
    try {
      log(name, "Aborting and rolling back...");

      // Deal with packages that were NOT installed before this install
      if (name === dappmanagerId) {
        // await whatToDoWithDappmanager();
        // Do nothing by now
      } else if (isUpdate) {
        await dockerComposeUpSafe(composePath);
      } else {
        await dockerComposeRm(composePath);
      }

      log(name, "Aborted and rolled back...");
    } catch (e) {
      logs.error(`Rollback error rolling starting ${name}: ${e.stack}`);
    }
}
