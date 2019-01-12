const fs = require('fs');

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
 * That's why there is an IS_CORE flag. Also the "Smart" functions
 * try to guess if the requested package is a core or not.
*/

// Define paths
module.exports = {

  packageRepoDir: function(PACKAGE_NAME, params, IS_CORE) {
    if (!PACKAGE_NAME) throw Error('Package name must be defined');
    if (!params) throw Error('Package name must be defined');
    return repoDir(PACKAGE_NAME, params, IS_CORE);
  },

  manifest: function(PACKAGE_NAME, params, IS_CORE) {
    if (!PACKAGE_NAME) throw Error('Package name must be defined');
    if (!params) throw Error('Package name must be defined');
    return repoDir(PACKAGE_NAME, params, IS_CORE) + '/'
    + manifestName(PACKAGE_NAME, params, IS_CORE);
  },

  dockerCompose: dockerCompose,

  dockerComposeSmart: function(PACKAGE_NAME, params) {
    if (!PACKAGE_NAME) throw Error('Package name must be defined');
    if (!params) throw Error('Package name must be defined');
    // First check for core docker-compose
    let DOCKERCOMPOSE_PATH = dockerCompose(PACKAGE_NAME, params, true);
    if (fs.existsSync(DOCKERCOMPOSE_PATH)) return DOCKERCOMPOSE_PATH;
    // Then check for dnp docker-compose
    return dockerCompose(PACKAGE_NAME, params, false);
  },

  envFile: envFile,

  envFileSmart: function(PACKAGE_NAME, params, isCORE) {
    if (!PACKAGE_NAME) throw Error('Package name must be defined');
    if (!params) throw Error('Package name must be defined');
    if (isCORE) return envFile(PACKAGE_NAME, params, true);
    // First check for core docker-compose
    let ENV_FILE_PATH = envFile(PACKAGE_NAME, params, true);
    if (fs.existsSync(ENV_FILE_PATH)) return ENV_FILE_PATH;
    // Then check for dnp docker-compose
    return envFile(PACKAGE_NAME, params, false);
  },

  image: function(PACKAGE_NAME, IMAGE_NAME, params, IS_CORE) {
    return repoDir(PACKAGE_NAME, params, IS_CORE) + '/' + IMAGE_NAME;
  },
};


// Helper functions

function dockerCompose(PACKAGE_NAME, params, IS_CORE) {
  return repoDir(PACKAGE_NAME, params, IS_CORE) + '/'
  + dockerComposeName(PACKAGE_NAME, params, IS_CORE);
}

function envFile(PACKAGE_NAME, params, IS_CORE) {
  return repoDir(PACKAGE_NAME, params, IS_CORE) + '/' + PACKAGE_NAME + params.ENV_FILE_EXTENSION;
}

function repoDir(PACKAGE_NAME, params, IS_CORE) {
  if (IS_CORE) return params.DNCORE_DIR;
  return params.REPO_DIR + PACKAGE_NAME;
}


function dockerComposeName(PACKAGE_NAME, params, IS_CORE) {
  if (!IS_CORE) return params.DOCKERCOMPOSE_NAME;

  const FILE_PREFIX = params.DOCKERCOMPOSE_NAME.split('.')[0];
  const EXTENSION = params.DOCKERCOMPOSE_NAME.split('.')[1];
  const PACKAGE_SHORT_NAME = PACKAGE_NAME.split('.')[0];

  return FILE_PREFIX + '-' + PACKAGE_SHORT_NAME + '.' + EXTENSION;
}


function manifestName(PACKAGE_NAME, params, IS_CORE) {
  if (!IS_CORE) return params.DAPPNODE_PACKAGE_NAME;

  const FILE_PREFIX = params.DAPPNODE_PACKAGE_NAME.split('.')[0];
  const EXTENSION = params.DAPPNODE_PACKAGE_NAME.split('.')[1];
  const PACKAGE_SHORT_NAME = PACKAGE_NAME.split('.')[0];

  return FILE_PREFIX + '-' + PACKAGE_SHORT_NAME + '.' + EXTENSION;
}
