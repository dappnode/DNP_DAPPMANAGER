import path from "path";
import { params } from "@dappnode/params";

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

export function getRepoDirPath(dnpName: string, isCore: boolean): string {
  if (isCore) return params.DNCORE_DIR;
  return path.join(params.REPO_DIR, dnpName);
}
