import fs from "fs";
import * as getPath from "./getPath";
import * as validate from "./validate";
import {
  writeComposeObj,
  readComposeObj,
  mergeEnvsAndOmitEnvFile
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
 * Returns a new compose after merging the user set data
 * - environment
 * - volumes
 * - ports
 */
export function mergeUserSetToCompose(
  compose: Compose,
  {
    userSetDnpVols = {},
    userSetDnpPorts = {},
    userSetDnpEnvs = {},
    previousEnvs = [],
    previousPorts = [],
    previousVolumes = []
  }: {
    userSetDnpVols: UserSetPackageVolsSingle;
    userSetDnpPorts: UserSetPackagePortsSingle;
    userSetDnpEnvs: PackageEnvs;
    previousEnvs: string[];
    previousPorts: string[];
    previousVolumes: string[];
  }
): Compose {
  const serviceName = parseServiceName(compose);
  const service = compose.services[serviceName];
  const defaultEnvironment = service.environment || [];
  const defaultVolumes = service.volumes || [];
  const defaultPorts = service.ports || [];

  let PROBLEM_WITH_PREVIOUS_VOLUMES;
  /**
   * A user installs bitcoin DNP and changes the bind mount of the
   * chain data to a different HD.
   * Then, the bitcoin DNP developer changes the bind mount of the
   * chain data.
   * How does the DAppNode know that the previous path has to be
   * renamed and which re-write corresponds to which mapping?
   */

  return {
    ...compose,
    services: {
      [serviceName]: {
        ...service,
        /**
         * Merge ENVs by priority
         * 1. userSet on installation
         * 2. previously set (already installed DNPs)
         * 3. default values from the manifest
         * Empty values will NOT be replaced on updates.
         */
        environment: stringifyEnvironment({
          ...parseEnvironment(defaultEnvironment),
          ...parseEnvironment(previousEnvs),
          ...userSetDnpEnvs
        }),
        // Volumes are normalized on the mergeVolumeArrays
        volumes: mergeUserSetVolumes(
          mergeVolumeArrays(previousVolumes, defaultVolumes),
          userSetDnpVols
        ),
        ports: mergePortArrays(previousPorts, defaultPorts).map(
          port => userSetDnpPorts[port] || port
        ),

        /**
         * Add the default values as labels
         */
        labels: {
          ...service.labels,
          ...writeDefaultsToLabels({
            defaultEnvironment,
            defaultVolumes,
            defaultPorts
          })
        }
      }
    }
  };
}

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
    mergeEnvsAndOmitEnvFile(name, parseEnvironment(envsArray));
    fs.unlinkSync(envFilePath);
    return true;
  }
  return false;
}
