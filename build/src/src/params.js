/**
 * DAPPMANAGER Parameters. This parameters are modified on execution for testing
 */

module.exports = {

  // Autobahn parameters
  autobahnUrl: 'ws://my.wamp.dnp.dappnode.eth:8080/ws',
  autobahnRealm: 'dappnode_admin',
  autobahnTag: {
    logUserActionToDappmanager: 'logUserActionToDappmanager',
    logUserAction: 'logUserAction.dappmanager.dnp.dappnode.eth',
  },

  // Installer paths
  CACHE_DIR: './cache/',
  REPO_DIR: './dnp_repo/',
  DNCORE_DIR: 'DNCORE',
  DAPPNODE_PACKAGE_NAME: 'dappnode_package.json',
  DOCKERCOMPOSE_NAME: 'docker-compose.yml',
  ENV_FILE_EXTENSION: '.env',
  // dappGet file paths
  REPO_FILE: 'DNCORE/repo.json',

  // Docker parameters
  TMP_REPO_DIR: './tmp_dnp_repo/',
  DNP_CONTAINER_NAME_PREFIX: 'DAppNodePackage-',
  CORE_CONTAINER_NAME_PREFIX: 'DAppNodeCore-',

  // Docker compose parameters
  DNP_VERSION_TAG: 'dnp_version',
  DNS_SERVICE: '172.33.1.2',
  DNP_NETWORK: 'dncore_network',
  CONTAINER_NAME_PREFIX: 'DAppNodePackage-',
  CONTAINER_CORE_NAME_PREFIX: 'DAppNodeCore-',

  // IPFS parameters
  IPFS: (process.env.IPFS_REDIRECT || 'my.ipfs.dnp.dappnode.eth'),

  // Web3 parameters
  WEB3HOSTWS: 'ws://my.ethchain.dnp.dappnode.eth:8546',

  // User Action Logs filename
  userActionLogsFilename: 'DNCORE/userActionLogs.log',

};
