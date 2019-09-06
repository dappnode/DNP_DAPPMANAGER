import fs from "fs";
import path from "path";
import { DappnodeParams } from "../types";

/*
 * Generates file paths given a set of parameters. This tool helps
 * reduce the possiblity of fileNotFound errors acting as a unique
 * source of truth for locating files.
 *
 * It returns paths for this files
 * - packageRepoDir
 * - manifest
 * - dockerCompose
 * - envFile
 * - image
 *
 * Core DNPs and regular DNPs are located in different folders.
 * That's why there is an isCore flag. Also the "Smart" functions
 * try to guess if the requested package is a core or not.
 */

// Define paths

export function packageRepoDir(
  dnpName: string,
  params: DappnodeParams,
  isCore: boolean
): string {
  if (!dnpName) throw Error("dnpName must be defined");
  if (!params) throw Error("params must be defined");
  return getRepoDirPath(dnpName, params, isCore);
}

export function manifest(
  dnpName: string,
  params: DappnodeParams,
  isCore: boolean
): string {
  if (!dnpName) throw Error("dnpName must be defined");
  if (!params) throw Error("params must be defined");
  return path.join(
    getRepoDirPath(dnpName, params, isCore),
    getManifestName(dnpName, isCore)
  );
}

export function dockerCompose(
  dnpName: string,
  params: DappnodeParams,
  isCore: boolean
): string {
  if (!dnpName) throw Error("dnpName must be defined");
  if (!params) throw Error("params must be defined");
  return getDockerComposePath(dnpName, params, isCore);
}

export function dockerComposeSmart(
  dnpName: string,
  params: DappnodeParams
): string {
  if (!dnpName) throw Error("dnpName must be defined");
  if (!params) throw Error("params must be defined");
  // First check for core docker-compose
  const DOCKERCOMPOSE_PATH = getDockerComposePath(dnpName, params, true);
  if (fs.existsSync(DOCKERCOMPOSE_PATH)) return DOCKERCOMPOSE_PATH;
  // Then check for dnp docker-compose
  return getDockerComposePath(dnpName, params, false);
}

export function envFile(
  dnpName: string,
  params: DappnodeParams,
  isCore: boolean
): string {
  if (!dnpName) throw Error("dnpName must be defined");
  if (!params) throw Error("params must be defined");
  return getEnvFilePath(dnpName, params, isCore);
}

export function envFileSmart(
  dnpName: string,
  params: DappnodeParams,
  isCore: boolean
): string {
  if (!dnpName) throw Error("dnpName must be defined");
  if (!params) throw Error("params must be defined");
  if (isCore) return getEnvFilePath(dnpName, params, true);
  // First check for core docker-compose
  const ENV_FILE_PATH = getEnvFilePath(dnpName, params, true);
  if (fs.existsSync(ENV_FILE_PATH)) return ENV_FILE_PATH;
  // Then check for dnp docker-compose
  return getEnvFilePath(dnpName, params, false);
}

export function image(
  dnpName: string,
  imageName: string,
  params: DappnodeParams,
  isCore: boolean
): string {
  if (!dnpName) throw Error("dnpName must be defined");
  if (!imageName) throw Error("imageName must be defined");
  if (!params) throw Error("params must be defined");
  return path.join(getRepoDirPath(dnpName, params, isCore), imageName);
}

// Helper functions

function getDockerComposePath(
  dnpName: string,
  params: DappnodeParams,
  isCore: boolean
): string {
  return path.join(
    getRepoDirPath(dnpName, params, isCore),
    getDockerComposeName(dnpName, isCore)
  );
}

function getEnvFilePath(
  dnpName: string,
  params: DappnodeParams,
  isCore: boolean
): string {
  return path.join(getRepoDirPath(dnpName, params, isCore), `${dnpName}.env`);
}

function getRepoDirPath(
  dnpName: string,
  params: DappnodeParams,
  isCore: boolean
): string {
  if (!params.DNCORE_DIR) throw Error("params.DNCORE_DIR must be defined");
  if (!params.REPO_DIR) throw Error("params.REPO_DIR must be defined");
  if (isCore) return params.DNCORE_DIR;
  return path.join(params.REPO_DIR, dnpName);
}

function getDockerComposeName(dnpName: string, isCore: boolean): string {
  if (isCore) {
    verifyDnpName(dnpName);
    const dnpShortName = (dnpName || "").split(".")[0];
    return `docker-compose-${dnpShortName}.yml`;
  } else {
    return "docker-compose.yml";
  }
}

function getManifestName(dnpName: string, isCore: boolean): string {
  if (isCore) {
    verifyDnpName(dnpName);
    const dnpShortName = (dnpName || "").split(".")[0];
    return `dappnode_package-${dnpShortName}.json`;
  } else {
    return "dappnode_package.json";
  }
}

// Utils

function verifyDnpName(dnpName: string): void {
  if (!dnpName) throw Error("dnpName must be defined");
  if (typeof dnpName !== "string")
    throw Error(
      `dnpName must be a string, but it's ${typeof dnpName}: ${JSON.stringify(
        dnpName
      )}`
    );
}
