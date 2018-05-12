const params = require('./params')

// Define paths
const REPO_DIR = params.REPO_DIR
const DAPPNODE_PACKAGE_NAME = params.DAPPNODE_PACKAGE_NAME
const DOCKERCOMPOSE_NAME = params.DOCKERCOMPOSE_NAME

function getPaths (dnpManifest) {
  let PACKAGE_REPO_DIR = REPO_DIR + dnpManifest.name
  let MANIFEST = PACKAGE_REPO_DIR + '/' + DAPPNODE_PACKAGE_NAME
  let DOCKERCOMPOSE = PACKAGE_REPO_DIR + '/' + DOCKERCOMPOSE_NAME
  let IMAGE = PACKAGE_REPO_DIR + '/' + dnpManifest.image.path
  return {
    PACKAGE_REPO_DIR,
    MANIFEST,
    DOCKERCOMPOSE,
    IMAGE
  }
}

module.exports = {
  getPaths
}
