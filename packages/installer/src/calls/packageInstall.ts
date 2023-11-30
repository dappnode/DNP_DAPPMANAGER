import { getInstallerPackagesData } from "../installer/getInstallerPackageData.js";
import createVolumeDevicePaths from "../installer/createVolumeDevicePaths.js";
// Utils
import {
  downloadImages,
  loadImages,
  flagPackagesAreInstalling,
  packageIsInstalling,
  runPackages,
  rollbackPackages,
  writeAndValidateFiles,
  postInstallClean,
  afterInstall,
} from "../installer/index.js";
import { logs, getLogUi, logUiClear } from "@dappnode/logger";
import { Routes, PackageRequest } from "@dappnode/common";
import { DappnodeInstaller } from "../dappnodeInstaller.js";

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
export async function packageInstall(
  dappnodeInstaller: DappnodeInstaller,
  {
    name: reqName,
    version: reqVersion,
    userSettings = {},
    options = {},
  }: Parameters<Routes["packageInstall"]>[0]
): Promise<void> {
  // 1. Parse the id into a request
  const req: PackageRequest = {
    name: sanitizeRequestName(reqName),
    ver: sanitizeRequestVersion(reqVersion),
  };
  const id = req.name;
  const log = getLogUi(id);

  try {
    log(id, "Resolving dependencies...");
    const { state, currentVersions, releases } =
      await dappnodeInstaller.getReleasesResolved(req, options);
    logs.info("Resolved request", req, state);

    // Throw any errors found in the release
    for (const release of releases) {
      if (
        release.warnings.coreFromForeignRegistry &&
        !options.BYPASS_CORE_RESTRICTION
      )
        throw Error(
          `Core package ${release.dnpName} is from a foreign registry`
        );
      if (!release.signedSafe && !options.BYPASS_SIGNED_RESTRICTION) {
        throw Error(
          `Package ${release.dnpName} is from untrusted origin and is not signed`
        );
      }
    }

    // Gather all data necessary for the install
    const packagesData = await getInstallerPackagesData({
      releases,
      userSettings,
      currentVersions,
      reqName,
    });
    logs.debug("Packages data", packagesData);
    logs.debug("User settings", userSettings);

    // Make sure that no package is already being installed
    const dnpNames = packagesData.map(({ dnpName }) => dnpName);
    for (const dnpName of dnpNames)
      if (packageIsInstalling(dnpName)) throw Error(`${dnpName} is installing`);

    try {
      flagPackagesAreInstalling(dnpNames);

      await downloadImages(dappnodeInstaller, packagesData, log);
      await loadImages(packagesData, log);

      await createVolumeDevicePaths(packagesData);
      await writeAndValidateFiles(packagesData, log);

      try {
        await runPackages(packagesData, log);
      } catch (e) {
        await rollbackPackages(packagesData, log);
        throw e;
      }

      await postInstallClean(packagesData, log);
      afterInstall(dnpNames);
      logUiClear({ id });
    } catch (e) {
      afterInstall(dnpNames);
      throw e;
    }
  } catch (e) {
    logUiClear({ id }); // Clear "resolving..." logs
    throw e;
  }
}

// Utils

const defaultVersion = "*";

/**
 * Strips a possible version appended to the name
 */
export function sanitizeRequestName(name: string): string {
  name = name.split("@")[0];
  return name;
}

export function sanitizeRequestVersion(version?: string): string {
  if (!version) return defaultVersion;
  return version;
}
