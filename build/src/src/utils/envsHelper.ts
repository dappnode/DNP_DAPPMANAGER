import fs from "fs";
import params from "../params";
import * as parse from "./parse";
import * as getPath from "./getPath";
import * as validate from "./validate";
import { EnvsInterface, ManifestInterface } from "../types";

/**
 * Loads a `.env` file from disk and parses its envs
 * @param {string} name
 * @param {bool} isCore
 * @returns {object} envs = {
 *   ENV_NAME: 'value'
 * }
 */
export function load(name: string, isCore: boolean) {
  const envFilePath = getPath.envFile(name, params, isCore);
  if (!fs.existsSync(envFilePath)) {
    return {};
  }
  const envFileData = fs.readFileSync(envFilePath, "utf8");
  return parse.envFile(envFileData);
}

/**
 * Stringifies an env object and write to an `.env` file to disk
 * @param {string} name
 * @param {bool} isCore
 * @param {object} envs = {
 *   ENV_NAME: 'value'
 * }
 */
export function write(name: string, isCore: boolean, envs: EnvsInterface) {
  const envFilePath = getPath.envFileSmart(name, params, isCore);
  fs.writeFileSync(validate.path(envFilePath), parse.stringifyEnvs(envs));
}

/**
 * Parses a manifest object to return an envs object
 * @param {object} manifest
 * @returns {object} envs = {
 *   ENV_NAME: 'value'
 * }
 */
export function getManifestEnvs(manifest: ManifestInterface) {
  const envsArray = (manifest.image || {}).environment || [];
  return envsArray.reduce((_envs: EnvsInterface, row) => {
    const [key, value] = (row || "").trim().split(/=(.*)/);
    _envs[key] = value || "";
    return _envs;
  }, {});
}
