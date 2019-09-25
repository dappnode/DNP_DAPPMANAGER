import path from "path";

const devMode = process.env.LOG_LEVEL === "DEV_MODE";

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

const params = {
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
  DNP_NETWORK_EXTERNAL_NAME: "dncore_network",
  DNP_NETWORK_INTERNAL_NAME: "network",
  CONTAINER_NAME_PREFIX: "DAppNodePackage-",
  CONTAINER_CORE_NAME_PREFIX: "DAppNodeCore-",

  // Auto-update parameters
  AUTO_UPDATE_DELAY: 24 * 60 * 60 * 1000, // 1 day
  AUTO_UPDATE_INCLUDE_IPFS_VERSIONS: false,

  // Watchers
  AUTO_UPDATE_WATCHER_INTERVAL: 5 * 60 * 1000, // 5 minutes
  CHECK_CHAIN_WATCHER_INTERVAL: 60 * 1000, // 1 minute
  EMIT_CHAIN_DATA_WATCHER_INTERVAL: 5 * 1000, // 5 seconds
  CHECK_DISK_USAGE_WATCHER_INTERVAL: 60 * 1000, // 1 minute
  NAT_RENEWAL_WATCHER_INTERVAL: 60 * 60 * 1000,

  // IPFS parameters
  IPFS_HOST:
    process.env.IPFS_HOST ||
    process.env.IPFS_REDIRECT ||
    "my.ipfs.dnp.dappnode.eth",
  IPFS_TIMEOUT: 30 * 1000,

  // Web3 parameters
  WEB3_HOST: process.env.WEB3_HOST || "ws://my.ethchain.dnp.dappnode.eth:8546",
  WEB3_HOST_HTTP:
    process.env.WEB3_HOST_HTTP ||
    process.env.WEB3_HOST ||
    "http://my.ethchain.dnp.dappnode.eth:8545",
  CHAIN_DATA_UNTIL: 0,

  // DAppNode specific names
  coreDnpName: "core.dnp.dappnode.eth"
};

if (devMode) {
  params.AUTO_UPDATE_DELAY = 3 * 60 * 1000; // 3 minutes
  params.AUTO_UPDATE_WATCHER_INTERVAL = 1 * 1000; // 1 second
  params.AUTO_UPDATE_INCLUDE_IPFS_VERSIONS = true;
}

if (process.env.NODE_ENV === "development") {
  params.autobahnUrl = "ws://localhost:8080/ws";
  params.autobahnRealm = "realm1";
}

export default params;
