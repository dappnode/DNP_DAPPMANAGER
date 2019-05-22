const fs = require("fs");
const path = require("path");

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
module.exports = {
  packageRepoDir: (dnpName, params, isCore) => {
    if (!dnpName) throw Error("dnpName must be defined");
    if (!params) throw Error("params must be defined");
    return getRepoDirPath(dnpName, params, isCore);
  },

  manifest: (dnpName, params, isCore) => {
    if (!dnpName) throw Error("dnpName must be defined");
    if (!params) throw Error("params must be defined");
    return path.join(
      getRepoDirPath(dnpName, params, isCore),
      getManifestName(dnpName, isCore)
    );
  },

  dockerCompose: (dnpName, params, isCore) => {
    if (!dnpName) throw Error("dnpName must be defined");
    if (!params) throw Error("params must be defined");
    return getDockerComposePath(dnpName, params, isCore);
  },

  dockerComposeSmart: (dnpName, params) => {
    if (!dnpName) throw Error("dnpName must be defined");
    if (!params) throw Error("params must be defined");
    // First check for core docker-compose
    let DOCKERCOMPOSE_PATH = getDockerComposePath(dnpName, params, true);
    if (fs.existsSync(DOCKERCOMPOSE_PATH)) return DOCKERCOMPOSE_PATH;
    // Then check for dnp docker-compose
    return getDockerComposePath(dnpName, params, false);
  },

  envFile: (dnpName, params, isCore) => {
    if (!dnpName) throw Error("dnpName must be defined");
    if (!params) throw Error("params must be defined");
    return getEnvFilePath(dnpName, params, isCore);
  },

  envFileSmart: (dnpName, params, isCore) => {
    if (!dnpName) throw Error("dnpName must be defined");
    if (!params) throw Error("params must be defined");
    if (isCore) return getEnvFilePath(dnpName, params, true);
    // First check for core docker-compose
    let ENV_FILE_PATH = getEnvFilePath(dnpName, params, true);
    if (fs.existsSync(ENV_FILE_PATH)) return ENV_FILE_PATH;
    // Then check for dnp docker-compose
    return getEnvFilePath(dnpName, params, false);
  },

  image: (dnpName, imageName, params, isCore) => {
    if (!dnpName) throw Error("dnpName must be defined");
    if (!imageName) throw Error("imageName must be defined");
    if (!params) throw Error("params must be defined");
    return path.join(getRepoDirPath(dnpName, params, isCore), imageName);
  }
};

// Helper functions

function getDockerComposePath(dnpName, params, isCore) {
  return path.join(
    getRepoDirPath(dnpName, params, isCore),
    getDockerComposeName(dnpName, isCore)
  );
}

function getEnvFilePath(dnpName, params, isCore) {
  return path.join(getRepoDirPath(dnpName, params, isCore), `${dnpName}.env`);
}

function getRepoDirPath(dnpName, params, isCore) {
  if (!params.DNCORE_DIR) throw Error("params.DNCORE_DIR must be defined");
  if (!params.REPO_DIR) throw Error("params.REPO_DIR must be defined");
  if (isCore) return params.DNCORE_DIR;
  return path.join(params.REPO_DIR, dnpName);
}

function getDockerComposeName(dnpName, isCore) {
  if (isCore) {
    const dnpShortName = (dnpName || "").split(".")[0];
    return `docker-compose-${dnpShortName}.yml`;
  } else {
    return "docker-compose.yml";
  }
}

function getManifestName(dnpName, isCore) {
  if (isCore) {
    const dnpShortName = (dnpName || "").split(".")[0];
    return `dappnode_package-${dnpShortName}.json`;
  } else {
    return "dappnode_package.json";
  }
}
