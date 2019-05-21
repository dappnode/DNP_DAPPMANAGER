const path = require("path");

/**
 * DAPPMANAGER Parameters. This parameters are modified on execution for testing
 */

/**
 * Main persistent folders, linked with docker volumes
 * - No need to prefix or sufix with slashes, path.join() is used in the whole app
 */
const DNCORE_DIR = "DNCORE"; // Bind volume (NOT deletable)
const REPO_DIR = "dnp_repo"; // Named volume (deletable)

module.exports = {
  // Autobahn parameters
  autobahnUrl: "ws://my.wamp.dnp.dappnode.eth:8080/ws",
  autobahnRealm: "dappnode_admin",

  // Installer paths
  REPO_DIR,
  DNCORE_DIR,
  TEMP_TRANSFER_DIR: path.join(REPO_DIR, ".temp-transfer"),

  // Docker compose parameters
  DNS_SERVICE: "172.33.1.2",
  DNP_NETWORK: "dncore_network",
  CONTAINER_NAME_PREFIX: "DAppNodePackage-",
  CONTAINER_CORE_NAME_PREFIX: "DAppNodeCore-",

  // IPFS parameters
  IPFS: process.env.IPFS_REDIRECT || "my.ipfs.dnp.dappnode.eth",
  IPFS_TIMEOUT: 30 * 1000,

  // Web3 parameters
  WEB3HOSTWS: "ws://my.ethchain.dnp.dappnode.eth:8546",
  WEB3HOSTHTTP: "http://my.ethchain.dnp.dappnode.eth:8545",
  CHAIN_DATA_UNTIL: 0,

  // User Action Logs filename
  userActionLogsFilename: path.join(REPO_DIR, "userActionLogs.log")
};
