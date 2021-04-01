import { UpdateAvailable } from "../types";
import { indexedByKey } from "./dbCache";

const PACKAGE_GETTING_STARTED_SHOW = "package-getting-started-show";
const PACKAGE_INSTALL_TIME = "package-install-time";
const PACKAGE_LATEST_KNOWN_VERSION = "package-latest-known-version";

export const packageGettingStartedShow = indexedByKey<boolean, string>({
  rootKey: PACKAGE_GETTING_STARTED_SHOW,
  getKey: dnpName => dnpName
});

export const packageInstallTime = indexedByKey<number, string>({
  rootKey: PACKAGE_INSTALL_TIME,
  getKey: dnpName => dnpName
});

export function addPackageInstalledMetadata(dnpName: string): void {
  packageGettingStartedShow.set(dnpName, true);
  packageInstallTime.set(dnpName, Date.now());
}

/**
 * Register the last emitted version for a dnpName
 * Only emit notifications for versions above this one
 */
export const packageLatestKnownVersion = indexedByKey<UpdateAvailable, string>({
  rootKey: PACKAGE_LATEST_KNOWN_VERSION,
  getKey: dnpName => dnpName
});
