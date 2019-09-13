import fs from "fs";
import { parseEnvironment, stringifyEnvironment } from "./dockerComposeParsers";
import * as getPath from "./getPath";
import * as validate from "./validate";
import { PackageEnvs, ManifestWithImage } from "../types";

/**
 * Loads a `.env` file from disk and parses its envs
 * @param {string} name
 * @param {bool} isCore
 * @returns {object} envs = {
 *   ENV_NAME: 'value'
 * }
 */
export function load(name: string, isCore: boolean): PackageEnvs {
  const envFilePath = getPath.envFile(name, isCore);
  if (!fs.existsSync(envFilePath)) {
    return {};
  }
  const envFileData = fs.readFileSync(envFilePath, "utf8");
  return parseEnvironment(
    envFileData
      .trim()
      .split("\n")
      .filter(row => row.trim())
  );
}

/**
 * Stringifies an env object and write to an `.env` file to disk
 * @param {string} name
 * @param {bool} isCore
 * @param {object} envs = {
 *   ENV_NAME: 'value'
 * }
 */
export function write(name: string, isCore: boolean, envs: PackageEnvs): void {
  writeStringified(name, isCore, stringifyEnvironment(envs));
}

export function writeStringified(
  name: string,
  isCore: boolean,
  environment: string[]
): void {
  const envFilePath = getPath.envFileSmart(name, isCore);
  fs.writeFileSync(validate.path(envFilePath), environment.join("\n"));
}

/**
 * Parses a manifest object to return an envs object
 * @param {object} manifest
 * @returns {object} envs = {
 *   ENV_NAME: 'value'
 * }
 */
export function getManifestEnvs(manifest: ManifestWithImage): PackageEnvs {
  const envsArray = (manifest.image || {}).environment || [];
  return parseEnvironment(envsArray);
}
