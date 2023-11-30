import { Routes } from "@dappnode/common";
import { packageInstall as pkgInstall } from "@dappnode/installer";
import { dappnodeInstaller } from "../index.js";

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
export async function packageInstall({
  name: reqName,
  version: reqVersion,
  userSettings = {},
  options = {}
}: Parameters<Routes["packageInstall"]>[0]): Promise<void> {
  await pkgInstall(dappnodeInstaller, {
    name: reqName,
    version: reqVersion,
    userSettings,
    options
  });
}
