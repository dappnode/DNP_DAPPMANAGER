import fs from "fs";
import { isEqual } from "lodash-es";
import memoize from "memoizee";
import { PackageVersionData } from "@dappnode/common";
import params from "../params";
import * as db from "../db";

/**
 * For debugging, print current version, branch and commit
 * { "version": "0.1.21",
 *   "branch": "master",
 *   "commit": "ab991e1482b44065ee4d6f38741bd89aeaeb3cec" }
 *
 * MEMOIZED: Data is read from disk only once at start-up
 */
export const getVersionData = memoize(function (): {
  data: PackageVersionData;
  ok: boolean;
  isNewVersion: boolean;
  message?: string;
} {
  try {
    const data: PackageVersionData = JSON.parse(
      fs.readFileSync(params.GIT_DATA_PATH, "utf8")
    );

    const previousData = db.versionData.get();
    const isNewVersion = !isEqual(previousData, data);
    if (isNewVersion) db.versionData.set(data);

    return { ok: true, data, isNewVersion };
  } catch (e) {
    return { ok: false, data: {}, isNewVersion: false, message: e.message };
  }
});

/**
 * Check if the current version data is new from the cached value
 * This function will only return true the first time it's called
 */
export function isNewDappmanagerVersion(): boolean {
  const { data, ok } = getVersionData();
  if (ok) {
    const previousData = db.versionData.get();
    const isNewVersion = !isEqual(previousData, data);
    if (isNewVersion) db.versionData.set(data);
    return isNewVersion;
  } else {
    return false;
  }
}
