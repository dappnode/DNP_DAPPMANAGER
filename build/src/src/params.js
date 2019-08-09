const path = require("path");

/**
 * DAPPMANAGER Parameters. This parameters are modified on execution for testing
 */

/**
 * Main persistent folders, linked with docker volumes
 * - No need to prefix or sufix with slashes, path.join() is used in the whole app
 */
let DNCORE_DIR = "DNCORE"; // Bind volume
let REPO_DIR = "dnp_repo"; // Named volume

if (process.env.TEST) {
  DNCORE_DIR = "test_files/";
  REPO_DIR = "test_files/";
}

module.exports = {
  // Autobahn parameters
  autobahnUrl: "ws://my.wamp.dnp.dappnode.eth:8080/ws",
  autobahnRealm: "dappnode_admin",

  // File paths
  REPO_DIR,
  DNCORE_DIR,
  userActionLogsFilename: path.join(DNCORE_DIR, "userActionLogs.log"),
  // lowdb requires an absolute path
  DB_PATH: path.resolve(DNCORE_DIR, "dappmanagerdb.json"),
  // Temp transfer dir must not be in a volume
  TEMP_TRANSFER_DIR: path.join("./", ".temp-transfer"),

  // Docker compose parameters
  DNS_SERVICE: "172.33.1.2",
  DNP_NETWORK: "dncore_network",
  CONTAINER_NAME_PREFIX: "DAppNodePackage-",
  CONTAINER_CORE_NAME_PREFIX: "DAppNodeCore-",

  // IPFS parameters
  IPFS_HOST: process.env.IPFS_REDIRECT || "my.ipfs.dnp.dappnode.eth",
  IPFS_TIMEOUT: 30 * 1000,

  // Web3 parameters
  WEB3_HOST_WS: "ws://my.ethchain.dnp.dappnode.eth:8546",
  WEB3_HOST_HTTP: "http://my.ethchain.dnp.dappnode.eth:8545",
  CHAIN_DATA_UNTIL: 0
};
