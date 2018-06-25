
// Define paths
module.exports = {

  packageRepoDir: function(PACKAGE_NAME, params, IS_CORE) {
    return repoDir(PACKAGE_NAME, params, IS_CORE);
  },

  manifest: function(PACKAGE_NAME, params, IS_CORE) {
    return repoDir(PACKAGE_NAME, params, IS_CORE) + '/'
    + manifestName(PACKAGE_NAME, params, IS_CORE);
  },

  dockerCompose: function(PACKAGE_NAME, params, IS_CORE) {
    return repoDir(PACKAGE_NAME, params, IS_CORE) + '/'
    + dockerComposeName(PACKAGE_NAME, params, IS_CORE);
  },

  envFile: function(PACKAGE_NAME, params, IS_CORE) {
    return repoDir(PACKAGE_NAME, params, IS_CORE) + '/' + PACKAGE_NAME + params.ENV_FILE_EXTENSION;
  },

  image: function(PACKAGE_NAME, IMAGE_NAME, params, IS_CORE) {
    return repoDir(PACKAGE_NAME, params, IS_CORE) + '/' + IMAGE_NAME;
  },
};


// Helper functions


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
