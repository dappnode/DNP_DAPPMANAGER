import { dynamicKeyValidate } from "./dbCache";
import { joinWithDot, stripDots } from "./dbUtils";

const PACKAGE_IS_INSTALLING = "package-is-installing";

// auto-update-settings

const packageIsInstallingKeyGetter = (dnpName: string): string =>
  joinWithDot(PACKAGE_IS_INSTALLING, stripDots(dnpName));

/**
 * Stores the last unix timestamp a package was attempted to be installed
 * - If all go well, when an installation is completed this number
 *   should be reseted to 0. If for some reason it doesn't, it will act
 *   as a timeout to allow installation retries even if the packages
 *   are not unflagged correctly
 */
export const packageIsInstalling = dynamicKeyValidate<number, string>(
  packageIsInstallingKeyGetter,
  () => true
);
