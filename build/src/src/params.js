/**
 * DAPPMANAGER Parameters. This parameters are modified on execution for testing
 */

module.exports = {
  // Autobahn parameters
  autobahnUrl: 'ws://my.wamp.dnp.dappnode.eth:8080/ws',
  autobahnRealm: 'dappnode_admin',

  // Installer paths
  CACHE_DIR: './cache/',
  REPO_DIR: './dnp_repo/',
  DNCORE_DIR: 'DNCORE',

  // Docker compose parameters
  DNS_SERVICE: '172.33.1.2',
  DNP_NETWORK: 'dncore_network',
  CONTAINER_NAME_PREFIX: 'DAppNodePackage-',
  CONTAINER_CORE_NAME_PREFIX: 'DAppNodeCore-',

  // IPFS parameters
  IPFS: process.env.IPFS_REDIRECT || 'my.ipfs.dnp.dappnode.eth',
  IPFS_TIMEOUT: 30 * 1000,

  // Web3 parameters
  WEB3HOSTWS: 'ws://my.ethchain.dnp.dappnode.eth:8546',
  WEB3HOSTHTTP: 'http://my.ethchain.dnp.dappnode.eth:8545',
  CHAIN_DATA_UNTIL: 0,

  // User Action Logs filename
  userActionLogsFilename: 'DNCORE/userActionLogs.log',
};
