import fs from "fs";
import * as getPath from "./getPath";
import * as validate from "./validate";
import {
  writeComposeObj,
  readComposeObj,
  mergeEnvsAndOmitDnpEnvFile
} from "./dockerComposeFile";
import {
  writeDefaultsToLabels,
  writeMetadataToLabels
} from "./containerLabelsDb";
import {
  parseEnvironment,
  stringifyEnvironment,
  parseServiceName,
  parseService,
  mergeVolumeArrays,
  mergePortArrays,
  mergeUserSetVolumes
} from "./dockerComposeParsers";
import params from "../params";
import {
  Compose,
  Manifest,
  UserSetPackageVols,
  UserSetPackagePorts,
  UserSetPackageEnvs,
  UserSetPackageVolsSingle,
  UserSetPackagePortsSingle,
  PackageEnvs,
  ComposeService
} from "../types";

/**
 * Improve error reporting, know what type of parsing is failing.
 * Without this error renaming, it's very hard to debug parsing errors
 */
function parseManifest(manifestString: string): Manifest {
  try {
    return JSON.parse(manifestString);
  } catch (e) {
    throw Error(`Error parsing manifest json: ${e.message}`);
  }
}

export function readConfigFiles({
  name,
  isCore
}: {
  name: string;
  isCore: boolean;
}): { manifest: Manifest; compose: Compose; environment: PackageEnvs } {
  const manifestPath = validate.path(getPath.manifest(name, isCore));
  const manifest: Manifest = parseManifest(
    fs.readFileSync(manifestPath, "utf8")
  );

  const composePath = validate.path(getPath.dockerCompose(name, isCore));
  const compose = readComposeObj(composePath);
  const service = parseService(compose);
  const environment = parseEnvironment(service.environment || []);

  return { manifest, compose, environment };
}

/**
 * [LEGACY] The previous method of injecting ENVs to a DNP was via .env files
 * This function will read the contents of .env files and add them in the
 * compose itself in the `environment` field in array format
 */
export function convertLegacyEnvFiles({
  name,
  isCore
}: {
  name: string;
  isCore: boolean;
}): boolean {
  const envFilePath = getPath.envFile(name, isCore);
  if (fs.existsSync(envFilePath)) {
    const envFileData = fs.readFileSync(envFilePath, "utf8");
    const envsArray = envFileData.trim().split("\n");
    mergeEnvsAndOmitDnpEnvFile(name, parseEnvironment(envsArray));
    fs.unlinkSync(envFilePath);
    return true;
  }
  return false;
}
