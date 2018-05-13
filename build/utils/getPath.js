
// Define paths
module.exports = {
  REPO_DIR: function(params) {
    return params.REPO_DIR
  },
  PACKAGE_REPO_DIR: function(PACKAGE_NAME, params) {
    return params.REPO_DIR + PACKAGE_NAME
  },
  MANIFEST: function(PACKAGE_NAME, params) {
    return params.REPO_DIR + PACKAGE_NAME + '/' + params.DAPPNODE_PACKAGE_NAME
  },
  DOCKERCOMPOSE: function(PACKAGE_NAME, params) {
    return params.REPO_DIR + PACKAGE_NAME + '/' + params.DOCKERCOMPOSE_NAME
  },
  ENV_FILE: function(PACKAGE_NAME, params) {
    return params.REPO_DIR + PACKAGE_NAME + '/' + PACKAGE_NAME + params.ENV_FILE_EXTENSION
  },
  IMAGE: function(dnpManifest, params) {
    return params.REPO_DIR + dnpManifest.name + '/' + dnpManifest.image.path
  }
}
