import { UpdateAvailable } from "../types";
import { dbCache } from "./dbFactory";
import { stripDots } from "./dbUtils";
import { dbKeys } from "./dbUtils";

export const packageGettingStartedShow = dbCache.indexedByKey<boolean, string>({
  rootKey: dbKeys.PACKAGE_GETTING_STARTED_SHOW,
  getKey: dnpName => stripDots(dnpName)
});

export const packageInstallTime = dbCache.indexedByKey<number, string>({
  rootKey: dbKeys.PACKAGE_INSTALL_TIME,
  getKey: dnpName => stripDots(dnpName)
});

export function addPackageInstalledMetadata(dnpName: string): void {
  packageGettingStartedShow.set(dnpName, true);
  packageInstallTime.set(dnpName, Date.now());
}

/**
 * Register the last emitted version for a dnpName
 * Only emit notifications for versions above this one
 */
export const packageLatestKnownVersion = dbCache.indexedByKey<
  UpdateAvailable,
  string
>({
  rootKey: dbKeys.PACKAGE_LATEST_KNOWN_VERSION,
  // Do NOT strip dots so the packages can be indexed by dnpName doing .getAll()
  getKey: dnpName => dnpName
});

/**
 * Store data sent by the package and show it to the UI
 */
export const packageSentData = dbCache.indexedByKey<
  Record<string, string>,
  string
>({
  rootKey: dbKeys.PACKAGE_SENT_DATA,
  getKey: dnpName => dnpName
});
