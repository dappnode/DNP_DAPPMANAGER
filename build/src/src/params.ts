import path from "path";
import { EthClientTargetPackage, UserSettings } from "./types";

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
const HOST_HOME = "/usr/src/dappnode";

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
  HOST_HOME,
  USER_ACTION_LOGS_DB_PATH: path.join(DNCORE_DIR, "userActionLogs.json"),
  // Legacy userActionLogs wiston .log file, migrated to USER_ACTION_LOGS_DB_PATH
  userActionLogsFilename: path.join(DNCORE_DIR, "userActionLogs.log"),
  // Static files serve
  avatarStaticDir: path.join(REPO_DIR, "avatars"),
  // lowdb requires an absolute path
  DB_MAIN_PATH: path.resolve(DNCORE_DIR, "maindb.json"),
  DB_CACHE_PATH: path.resolve(DNCORE_DIR, "dappmanagerdb.json"),
  // Temp transfer dir must not be in a volume
  TEMP_TRANSFER_DIR: path.join("./", ".temp-transfer"),
  // Must NOT be an absolute path to work from inside the DAPPMANAGER and out
  GLOBAL_ENVS_PATH_CORE: path.join(".", GLOBAL_ENVS_FILE_NAME),
  GLOBAL_ENVS_PATH_DNP: path.join("../../", DNCORE_DIR, GLOBAL_ENVS_FILE_NAME),
  GLOBAL_ENVS_PATH_NODE: path.join(DNCORE_DIR, GLOBAL_ENVS_FILE_NAME),
  PRIVATE_KEY_PATH: path.join(DNCORE_DIR, ".indentity.private.key"),
  // Host script paths
  HOST_SCRIPTS_DIR_FROM_HOST: path.join(HOST_HOME, "DNCORE/scripts/host"),
  HOST_SCRIPTS_DIR: "DNCORE/scripts/host",
  HOST_SCRIPTS_SOURCE_DIR: "hostScripts",
  // Local fallback versions, to be able to install and eth client without connecting to remote
  FALLBACK_VERSIONS_PATH: path.join(DNCORE_DIR, "packages-content-hash.csv"),
  // Version data file, created in the docker image build process
  VERSION_DATA_FILE_PATH: "/usr/src/app/.version.json",

  // HTTP API parameters
  apiUrl: "http://dappmanager.dappnode",
  ipfsGateway: "http://ipfs.dappnode:8080/ipfs/",
  HTTP_API_PORT: 3000,

  // VPN API
  vpnApiRpcUrl: "http://172.33.1.4:3000/rpc",

  // Docker compose parameters
  DNS_SERVICE: "172.33.1.2",
  DNP_NETWORK_EXTERNAL_NAME: "dncore_network",
  DNP_NETWORK_INTERNAL_NAME: "network",
  CONTAINER_NAME_PREFIX: "DAppNodePackage-",
  CONTAINER_CORE_NAME_PREFIX: "DAppNodeCore-",
  CONTAINER_TOOL_NAME_PREFIX: "DAppNodeTool-",
  // Docker volume parameters
  MOUNTPOINT_DEVICE_PREFIX: "dappnode-volumes",
  MOUNTPOINT_DEVICE_LEGACY_TAG: "legacy:",
  USER_SETTING_DISABLE_TAG: "disable:",

  // Auto-update parameters
  AUTO_UPDATE_DELAY: 24 * 60 * 60 * 1000, // 1 day
  AUTO_UPDATE_INCLUDE_IPFS_VERSIONS: false,

  // Watchers
  AUTO_UPDATE_WATCHER_INTERVAL: 5 * 60 * 1000, // 5 minutes
  CHECK_CHAIN_WATCHER_INTERVAL: 60 * 1000, // 1 minute
  EMIT_CHAIN_DATA_WATCHER_INTERVAL: 5 * 1000, // 5 seconds
  CHECK_DISK_USAGE_WATCHER_INTERVAL: 60 * 1000, // 1 minute
  NAT_RENEWAL_WATCHER_INTERVAL: 60 * 60 * 1000, // 1 hour
  NSUPDATE_WATCHER_INTERVAL: 60 * 60 * 1000, // 1 hour

  // IPFS parameters
  IPFS_HOST:
    process.env.IPFS_HOST ||
    process.env.IPFS_REDIRECT ||
    "http://ipfs.dappnode:5001",
  IPFS_TIMEOUT: 30 * 1000,

  // Web3 parameters
  WEB3_HOST: process.env.WEB3_HOST || "http://fullnode.dappnode:8545",
  CHAIN_DATA_UNTIL: 0,

  // DAppNode specific names
  bindDnpName: "bind.dnp.dappnode.eth",
  coreDnpName: "core.dnp.dappnode.eth",
  dappmanagerDnpName: "dappmanager.dnp.dappnode.eth",
  restartDnpName: "restart.dnp.dappnode.eth",
  vpnDnpName: "vpn.dnp.dappnode.eth",
  wifiDnpName: "wifi.dnp.dappnode.eth",
  vpnDataVolume: "dncore_vpndnpdappnodeeth_data",
  restartContainerName: "DAppNodeTool-restart.dnp.dappnode.eth",
  restartDnpVolumes: [
    "/usr/src/dappnode/DNCORE/:/usr/src/app/DNCORE/",
    "/var/run/docker.sock:/var/run/docker.sock"
  ],

  // DYNDNS parameters
  DYNDNS_HOST: "https://ns.dappnode.io",
  DYNDNS_DOMAIN: "dyndns.dappnode.io",
  DYNDNS_INTERVAL: 30 * 60 * 1000, // 30 minutes

  // DAppNode remote fullnode service
  REMOTE_MAINNET_RPC_URL:
    process.env.REMOTE_MAINNET_RPC_URL || "https://web3.dappnode.net",

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
    PUBKEY: "_DAPPNODE_GLOBAL_PUBKEY", // "0x048e66b3e549818ea2cb354fb70749f6c8de8fa484f7530fc447d5fe80a1c424e4f5ae648d648c980ae7095d1efad87161d83886ca4b6c498ac22a93da5099014a",
    ADDRESS: "_DAPPNODE_GLOBAL_ADDRESS", // "0x6B3D49d4965584C28Fbf14B82b1012664a73b9Ab"
    PUBLIC_IP: "_DAPPNODE_GLOBAL_PUBLIC_IP", // "138.68.106.96"
    SERVER_NAME: "_DAPPNODE_GLOBAL_SERVER_NAME" // "MyDAppNode"
  },

  // nsenter line to run commands on host
  NSENTER_COMMAND:
    "docker run --rm --privileged --pid=host -t alpine:3.8 nsenter -t 1 -m -u -n -i",

  // Use a deterministic predefined key for the ADMIN side (DAPPMANAGER's is generated)
  ADMIN_NACL_SECRET_KEY: "DAppNodeDAppNodeDAppNodeDAppNodeDAppNodeDao=",
  ADMIN_NACL_PUBLIC_KEY: "cYo1NA7/+PQ22PeqrRNGhs1B84SY/fuomNtURj5SUmQ=",

  // Fullnode names
  ALLOWED_FULLNODE_DNP_NAMES: [
    "geth.dnp.dappnode.eth",
    "parity.dnp.dappnode.eth"
  ],

  // ETHFORWARD / HTTP proxy params
  ETHFORWARD_HTTP_PROXY_PORT: process.env.ETHFORWARD_HTTP_PROXY_PORT || 80,
  ETHFORWARD_IPFS_REDIRECT: "http://ipfs.dappnode:8080/ipfs/",
  ETHFORWARD_SWARM_REDIRECT: "http://swarm.dappnode",
  ETHFORWARD_PIN_ON_VISIT: true
};

if (devMode) {
  params.AUTO_UPDATE_DELAY = 3 * 60 * 1000; // 3 minutes
  params.AUTO_UPDATE_WATCHER_INTERVAL = 1 * 1000; // 1 second
  params.AUTO_UPDATE_INCLUDE_IPFS_VERSIONS = true;
}

if (process.env.NODE_ENV === "development") {
  params.apiUrl = "http://localhost:3000";
  // params.autobahnUrl = "ws://localhost:8080/ws";
  // params.autobahnRealm = "realm1";
}

export default params;

/**
 * Link between an ethClientTarget keyword and its pacakge information
 * Declared above to use stronger typings
 */
export const ethClientData: {
  [P in EthClientTargetPackage]: {
    name: string;
    url?: string; // Only provide a URL if it's not "http://geth.dappnode:8545"
    version?: string;
    userSettings?: UserSettings; // Custom installation for geth light client
  }
} = {
  "geth-light": {
    name: "geth.dnp.dappnode.eth",
    userSettings: { environment: { SYNCMODE: "light" } }
  },
  geth: { name: "geth.dnp.dappnode.eth" },
  openethereum: { name: "openethereum.dnp.dappnode.eth" },
  nethermind: { name: "nethermind.public.dappnode.eth" }
};
