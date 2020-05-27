import fs from "fs";
import params from "../params";
import * as eventBus from "../eventBus";
import * as db from "../db";
// Modules
import getImage, { verifyDockerImage } from "../modules/release/getImage";
import {
  dockerLoad,
  dockerCleanOldImages
} from "../modules/docker/dockerCommands";
import { getInstallerPackagesData } from "../modules/installer/getInstallerPackageData";
import createVolumeDevicePaths from "../modules/installer/createVolumeDevicePaths";
// Utils
import { Log, getLogUi, logUiClear } from "../utils/logUi";
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
  InstallPackageDataPaths,
  PackageRequest
} from "../types";
import Logs from "../logs";
import {
  downloadImages,
  loadImages,
  runPackages,
  rollbackPackages,
  writeAndValidateFiles,
  postInstallClean
} from "../modules/installer";
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
  const log = getLogUi(id);

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
    await writeAndValidateFiles(packagesData, log);

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
 * Common tasks to perform after a successful or failed installation
 * @param id
 * @param packagesData
 */
async function onFinish(id: string, packagesData: InstallPackageData[]) {
  /**
   * [NAT-RENEWAL] Trigger a natRenewal update to open ports if necessary
   * Since a package installation is not a very frequent activity it is okay to be
   * called on each install. Internal mechanisms protect the natRenewal function
   * to be called too often.
   */
  eventBus.runNatRenewal.emit();

  // Emit packages update
  const ids = packagesData.map(({ name }) => name);
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ ids });

  // Flag the packages as NOT installing.
  // Must be called also on Error, otherwise packages can't be re-installed
  flagPackagesAreNotInstalling(ids);

  // Instruct the UI to clear isInstalling logs
  logUiClear({ id });
}
