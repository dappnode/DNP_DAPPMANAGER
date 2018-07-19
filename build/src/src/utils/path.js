
// Define paths

function getPathsByManifest(dnpManifest, params) {
  const REPO_DIR = params.REPO_DIR;
  const DAPPNODE_PACKAGE_NAME = params.DAPPNODE_PACKAGE_NAME;
  const DOCKERCOMPOSE_NAME = params.DOCKERCOMPOSE_NAME;

  let PACKAGE_REPO_DIR = REPO_DIR + dnpManifest.name;
  let MANIFEST = PACKAGE_REPO_DIR + '/' + DAPPNODE_PACKAGE_NAME;
  let DOCKERCOMPOSE = PACKAGE_REPO_DIR + '/' + DOCKERCOMPOSE_NAME;
  let IMAGE = PACKAGE_REPO_DIR + '/' + dnpManifest.image.path;
  return {
    REPO_DIR,
    PACKAGE_REPO_DIR,
    MANIFEST,
    DOCKERCOMPOSE,
    IMAGE,
  };
}

function getPathsByPackageName(packageName, params) {
  const REPO_DIR = params.REPO_DIR;
  const DAPPNODE_PACKAGE_NAME = params.DAPPNODE_PACKAGE_NAME;
  const DOCKERCOMPOSE_NAME = params.DOCKERCOMPOSE_NAME;
  const ENV_FILE_EXTENSION = params.ENV_FILE_EXTENSION;

  let PACKAGE_REPO_DIR = REPO_DIR + packageName;
  let MANIFEST = PACKAGE_REPO_DIR + '/' + DAPPNODE_PACKAGE_NAME;
  let DOCKERCOMPOSE = PACKAGE_REPO_DIR + '/' + DOCKERCOMPOSE_NAME;
  let ENV_FILE = PACKAGE_REPO_DIR + '/' + packageName + ENV_FILE_EXTENSION;
  return {
    REPO_DIR,
    PACKAGE_REPO_DIR,
    MANIFEST,
    DOCKERCOMPOSE,
    ENV_FILE,
  };
}


module.exports = {
  getPathsByManifest,
  getPathsByPackageName,
};
