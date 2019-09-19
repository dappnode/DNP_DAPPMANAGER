import merge from "deepmerge";
import { uniq } from "lodash";
import { PkgsObj } from "../types";

/**
 * Merges object packages, returning unique arrays.
 * Used to remove duplicate versions in the package version array
 * pkgsObject = {
 *   A: [ '2.0.0' ],
 *   C: [ '2.0.0', '1.0.0' ],
 *   B: [ '1.0.0', '1.1.0', '2.0.0' ]
 * }
 * @param {*} pkgsObj1
 * @param {*} pkgsObj2
 * @returns {object} pkgsObjects merged
 */
export default function mergePkgs(
  pkgsObj1: PkgsObj,
  pkgsObj2: PkgsObj
): PkgsObj {
  // Check arguments
  if (!pkgsObj1) throw Error("pkgsObj1 is undefined");
  if (!pkgsObj2) throw Error("pkgsObj2 is undefined");

  return merge(pkgsObj1, pkgsObj2, {
    arrayMerge: (a1, a2) => uniq([...a1, ...a2])
  });
}
