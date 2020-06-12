import { ManifestWithImage } from "common/types";
import { EnvsVerbose } from "../types";

/**
 * Parse the ENVs of a manifest object
 * @param {object} manifest
 * @returns {object} envs = {
 *   name: "ENV_NAME",
 *   value: "ENV_VALUE",
 *   index: 1
 * }
 */
export default function parseManifestEnvs(
  manifest?: ManifestWithImage
): EnvsVerbose {
  const envsArray = ((manifest || {}).image || {}).environment || [];
  return envsArray.reduce((obj: EnvsVerbose, row, index) => {
    const [key, value = ""] = (row || "").trim().split(/=(.*)/);
    obj[key] = { name: key, value, index };
    return obj;
  }, {});
}
