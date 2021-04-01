import { UpdateAvailable } from "../types";
import { dynamicKeyValidate } from "./dbCache";
import { joinWithDot } from "./dbUtils";

const PACKAGE_GETTING_STARTED_SHOW = "package-getting-started-show";
const PACKAGE_INSTALL_TIME = "package-install-time";
const PACKAGE_LATEST_KNOWN_VERSION = "package-latest-known-version";

const keyGetterGettingStartedShow = (dnpName: string): string =>
  joinWithDot(PACKAGE_GETTING_STARTED_SHOW, dnpName);
const keyGetterInstallTime = (dnpName: string): string =>
  joinWithDot(PACKAGE_INSTALL_TIME, dnpName);
const alwaysValid = (): true => true;

export const packageGettingStartedShow = dynamicKeyValidate<boolean, string>(
  keyGetterGettingStartedShow,
  alwaysValid
);

export const packageInstallTime = dynamicKeyValidate<number, string>(
  keyGetterInstallTime,
  alwaysValid
);

export function addPackageInstalledMetadata(dnpName: string): void {
  packageGettingStartedShow.set(dnpName, true);
  packageInstallTime.set(dnpName, Date.now());
}

/**
 * Register the last emitted version for a dnpName
 * Only emit notifications for versions above this one
 */
export const packageLatestKnownVersion = dynamicKeyValidate<
  UpdateAvailable,
  string
>(dnpName => joinWithDot(PACKAGE_LATEST_KNOWN_VERSION, dnpName), alwaysValid);
