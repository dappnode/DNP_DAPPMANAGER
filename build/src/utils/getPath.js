
// Define paths
module.exports = {

  PACKAGE_REPO_DIR: function(PACKAGE_NAME, params, IS_CORE) {
    return REPO_DIR(PACKAGE_NAME, params, IS_CORE)
  },

  MANIFEST: function(PACKAGE_NAME, params, IS_CORE) {
    return REPO_DIR(PACKAGE_NAME, params, IS_CORE) + '/' + MANIFEST_NAME(PACKAGE_NAME, params, IS_CORE)
  },

  DOCKERCOMPOSE: function(PACKAGE_NAME, params, IS_CORE) {
    return REPO_DIR(PACKAGE_NAME, params, IS_CORE) + '/' + DOCKERCOMPOSE_NAME(PACKAGE_NAME, params, IS_CORE)
  },

  ENV_FILE: function(PACKAGE_NAME, params, IS_CORE) {
    return REPO_DIR(PACKAGE_NAME, params, IS_CORE) + '/' + PACKAGE_NAME + params.ENV_FILE_EXTENSION
  },

  IMAGE: function(PACKAGE_NAME, IMAGE_NAME, params, IS_CORE) {
    return REPO_DIR(PACKAGE_NAME, params, IS_CORE) + '/' + IMAGE_NAME
  }
}


// Helper functions


function REPO_DIR(PACKAGE_NAME, params, IS_CORE) {
  if (IS_CORE) return params.DNCORE_DIR
  return params.REPO_DIR + PACKAGE_NAME
}


function DOCKERCOMPOSE_NAME(PACKAGE_NAME, params, IS_CORE) {

  if (!IS_CORE) return params.DOCKERCOMPOSE_NAME

  const FILE_PREFIX = params.DOCKERCOMPOSE_NAME.split('.')[0]
  const EXTENSION = params.DOCKERCOMPOSE_NAME.split('.')[1]
  const PACKAGE_SHORT_NAME = PACKAGE_NAME.split('.')[0]

  return FILE_PREFIX + '-' + PACKAGE_SHORT_NAME + '.' + EXTENSION
}


function MANIFEST_NAME(PACKAGE_NAME, params, IS_CORE) {

  if (!IS_CORE) return params.DAPPNODE_PACKAGE_NAME

  const FILE_PREFIX = params.DAPPNODE_PACKAGE_NAME.split('.')[0]
  const EXTENSION = params.DAPPNODE_PACKAGE_NAME.split('.')[1]
  const PACKAGE_SHORT_NAME = PACKAGE_NAME.split('.')[0]

  return FILE_PREFIX + '-' + PACKAGE_SHORT_NAME + '.' + EXTENSION
}
