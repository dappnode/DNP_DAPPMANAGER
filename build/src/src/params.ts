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
const GLOBAL_ENVS_FILE_NAME = "dnp.dappnode.global.env";

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
  DB_MAIN_PATH: path.resolve(DNCORE_DIR, "maindb.json"),
  DB_CACHE_PATH: path.resolve(DNCORE_DIR, "dappmanagerdb.json"),
  // Temp transfer dir must not be in a volume
  TEMP_TRANSFER_DIR: path.join("./", ".temp-transfer"),
  // Must NOT be an absolute path to work from inside the DAPPMANAGER and out
  GLOBAL_ENVS_PATH_CORE: path.join(".", GLOBAL_ENVS_FILE_NAME),
  GLOBAL_ENVS_PATH_DNP: path.join("../../", DNCORE_DIR, GLOBAL_ENVS_FILE_NAME),
  GLOBAL_ENVS_PATH_NODE: path.join(DNCORE_DIR, GLOBAL_ENVS_FILE_NAME),

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
  coreDnpName: "core.dnp.dappnode.eth",
  vpnDataVolume: "dncore_vpndnpdappnodeeth_data",

  // DYNDNS parameters
  DYNDNS_HOST: "https://ns.dappnode.io",
  DYNDNS_DOMAIN: "dyndns.dappnode.io",
  DYNDNS_INTERVAL: 30 * 60 * 1000, // 30 minutes

  // System file paths
  HOSTNAME_PATH: "/etc/dappnodename",
  STATIC_IP_PATH: "/usr/src/app/config/static_ip",
  VPNDB_PATH: "/usr/src/app/secrets/vpndb.json",

  // Global ENVs names
  GLOBAL_ENVS: {
    ACTIVE: "_DAPPNODE_GLOBAL_ENVS_ACTIVE",
    DOMAIN: "_DAPPNODE_GLOBAL_DOMAIN", // "" || "6b3d49d4965584c2.dyndns.dappnode.io"
    STATIC_IP: "_DAPPNODE_GLOBAL_STATIC_IP", // "" || "138.68.106.96"
    HOSTNAME: "_DAPPNODE_GLOBAL_HOSTNAME", // "6b3d49d4965584c2.dyndns.dappnode.io" || "138.68.106.96"
    INTERNAL_IP: "_DAPPNODE_GLOBAL_INTERNAL_IP", // "192.168.0.1"
    UPNP_AVAILABLE: "_DAPPNODE_GLOBAL_UPNP_AVAILABLE", // "true" || "false"
    NO_NAT_LOOPBACK: "_DAPPNODE_GLOBAL_NO_NAT_LOOPBACK", // "true" || "false"
    PUBKEY: "_DAPPNODE_GLOBAL_PUBKEY", // "0x6B3D49d4965584C28Fbf14B82b1012664a73b9Ab"
    PUBLIC_IP: "_DAPPNODE_GLOBAL_PUBLIC_IP", // "138.68.106.96"
    SERVER_NAME: "_DAPPNODE_GLOBAL_SERVER_NAME" // "MyDAppNode"
  }
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
