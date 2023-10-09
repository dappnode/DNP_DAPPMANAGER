import { omit } from "lodash-es";
import path from "path";
import { getRepoDirPath } from "@dappnode/utils";

/*
 * Generates file paths given a set of parameters. This tool helps
 * reduce the possiblity of fileNotFound errors acting as a unique
 * source of truth for locating files.
 *
 * It returns paths for this files
 * - packageRepoDir
 * - manifest
 * - dockerCompose
 * - image
 *
 * Core DNPs and regular DNPs are located in different folders.
 * That's why there is an isCore flag. Also the "Smart" functions
 * try to guess if the requested package is a core or not.
 */

// Define paths

export function manifest(dnpName: string, isCore: boolean): string {
  return path.join(
    getRepoDirPath(dnpName, isCore),
    getManifestName(dnpName, isCore)
  );
}

export function image(
  dnpName: string,
  version: string,
  isCore: boolean
): string {
  return path.join(
    getRepoDirPath(dnpName, isCore),
    `${dnpName}_${version}.tar.xz`
  );
}

/**
 * DEPRECATED
 */
export function envFile(dnpName: string, isCore: boolean): string {
  return getEnvFilePath(dnpName, isCore);
}

// Helper functions

/**
 * DEPRECATED
 */
function getEnvFilePath(dnpName: string, isCore: boolean): string {
  return path.join(getRepoDirPath(dnpName, isCore), `${dnpName}.env`);
}

function getManifestName(dnpName: string, isCore: boolean): string {
  if (isCore) return `dappnode_package-${getShortName(dnpName)}.json`;
  else return "dappnode_package.json";
}

function getShortName(dnpName: string): string {
  verifyDnpName(dnpName);
  return ((dnpName || "").split(".")[0] || "").toLowerCase();
}

// Utils

function verifyDnpName(dnpName: string): void {
  if (typeof dnpName !== "string")
    throw Error(
      `dnpName must be a string, but it's ${typeof dnpName}: ${JSON.stringify(
        dnpName
      )}`
    );
}

export function backupPath(anyPath: string): string {
  const pathObj = path.parse(anyPath);
  // From NodeJS docs
  // `name` + `ext` will be used if `base` is not specified.
  return path.format({
    ...omit(pathObj, "base"),
    ext: `.backup${pathObj.ext}`
  });
}
