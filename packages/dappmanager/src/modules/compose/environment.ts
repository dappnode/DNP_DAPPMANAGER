import { PackageEnvs } from "@dappnode/dappnodesdk";
import { pickBy } from "lodash-es";

/**
 * Parses an envs array from a manifest or docker-compose.yml
 * [NOTE]: protect against faulty lines: envsArray = [""], they can break a compose
 * - Filter by row.trim()
 * - Make sure the key is define before adding to the envs object
 * @param envsArray:
 * ["NAME=VALUE",  "NOVAL",   "COMPLEX=D=D=D  = 2"]
 * @returns envs =
 * { NAME: "VALUE", NOVAL: "", COMPLEX: "D=D=D  = 2" }
 */
export function parseEnvironment(
  envsArray: string[] | PackageEnvs
): PackageEnvs {
  // Make sure ENVs are in array format
  if (typeof envsArray === "object" && !Array.isArray(envsArray))
    return envsArray;

  return envsArray
    .filter(row => (row || "").trim())
    .reduce((envs: PackageEnvs, row) => {
      const [key, value] = (row || "").trim().split(/=(.*)/);
      return key ? { ...envs, [key]: value || "" } : envs;
    }, {});
}

/**
 * Reverse of parseEnvironment, stringifies envs object to envsArray
 * @param envs =
 * { NAME: "VALUE", NOVAL: "", COMPLEX: "D=D=D  = 2" }
 * @returns envsArray =
 * ["NAME=VALUE",  "NOVAL",   "COMPLEX=D=D=D  = 2"]
 */
export function stringifyEnvironment(envs: PackageEnvs): string[] {
  return Object.entries(envs)
    .filter(([name]) => name)
    .map(([name, value]) => (value ? [name, value].join("=") : name));
}

/**
 * Merges filtering faulty ENV names that invalidates a docker-compose.
 * environment:
 *   - ""
 * The previous docker-compose.yml snippet is invalid
 *
 * @param envs1 package envs with MORE priority
 * @param envs2 package envs with LESS priority
 * @returns merged package envs
 */
export function mergeEnvs(envs1: PackageEnvs, envs2: PackageEnvs): PackageEnvs {
  return pickBy(
    {
      ...envs2,
      ...envs1
    },
    (_0, key) => key
  );
}
