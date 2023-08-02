import path from "path";
import { EthClientTargetPackage, UserSettings } from "@dappnode/common";
import { getContainerDomain } from "@dappnode/types";

const devMode = process.env.LOG_LEVEL === "DEV_MODE";

const MINUTE = 60 * 1000; // miliseconds
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * DAPPMANAGER Parameters. This parameters are modified on execution for testing
 */

/**
 * Main persistent folders, linked with docker volumes
 * - No need to prefix or sufix with slashes, path.join() is used in the whole app
 */
let DNCORE_DIR = "/usr/src/app/DNCORE"; // Bind volume
let REPO_DIR = "/usr/src/app/dnp_repo"; // Named volume
const GLOBAL_ENVS_FILE_NAME = "dnp.dappnode.global.env";
const HOST_HOME = "/usr/src/dappnode";

if (process.env.TEST) {
  DNCORE_DIR = "./DNCORE";
  REPO_DIR = "./dnp_repo";
}

/** Absolute global ENVs .env file from DAPPMANAGER containers */
const GLOBAL_ENVS_PATH = path.join(DNCORE_DIR, GLOBAL_ENVS_FILE_NAME);

const params = {
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

  // File with sole purpose of handling admin password hash. Must be deletable
  ADMIN_RECOVERY_FILE: path.join(DNCORE_DIR, "admin-recovery-token.txt"),
  ADMIN_PASSWORDS_JSON_FILE: path.join(DNCORE_DIR, "admin-passwords.json"),
  ADMIN_STATUS_JSON_FILE: path.join(DNCORE_DIR, "admin-status.json"),

  // Temp transfer dir must not be in a volume
  TEMP_TRANSFER_DIR: path.join("./", ".temp-transfer"),
  // Must NOT be an absolute path to work from inside the DAPPMANAGER and out
  /** Relative path to global ENVs from a core DNP docker-compose */
  GLOBAL_ENVS_PATH_FOR_CORE: path.relative(DNCORE_DIR, GLOBAL_ENVS_PATH),
  GLOBAL_ENVS_PATH_FOR_DNP: GLOBAL_ENVS_PATH,
  GLOBAL_ENVS_PATH: GLOBAL_ENVS_PATH,
  PRIVATE_KEY_PATH: path.join(DNCORE_DIR, ".indentity.private.key"),
  // Host script paths
  HOST_SCRIPTS_DIR_FROM_HOST: path.join(HOST_HOME, "DNCORE/scripts/host"),
  HOST_SCRIPTS_DIR: "DNCORE/scripts/host",
  HOST_SCRIPTS_SOURCE_DIR: "hostScripts",
  // Host services paths
  HOST_SERVICES_DIR_FROM_HOST: path.join(HOST_HOME, "DNCORE/services/host"),
  HOST_SYSTEMD_DIR_FROM_HOST: "/etc/systemd/system",
  HOST_SERVICES_DIR: "DNCORE/services/host",
  HOST_SERVICES_SOURCE_DIR: "hostServices",
  // Local fallback versions, to be able to install and eth client without connecting to remote
  FALLBACK_VERSIONS_PATH: path.join(DNCORE_DIR, "packages-content-hash.csv"),
  // Version data file, created in the docker image build process
  GIT_DATA_PATH: process.env.GIT_DATA_PATH || ".git-data.json",
  // UI static files
  UI_FILES_PATH: process.env.UI_FILES_PATH || "dist",

  // Signature API
  SIGNATURE_PREFIX: "\x1dDappnode Signed Message:",

  DAPPNODE_REGISTRY: ".dnp.dappnode.eth",

  // HTTP API parameters
  /** Use the internal ipfs gateway proxy so the UI works served from the HTTPs Portal */
  IPFS_GATEWAY: "/ipfs/",
  TEST_API_PORT: 7000,
  HTTP_API_PORT: process.env.HTTP_API_PORT || 80,
  HTTP_CORS_WHITELIST: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://my.dappnode",
    "http://dappnode.local"
  ],

  // API auth sessions
  SESSIONS_SECRET_FILE: path.join(DNCORE_DIR, "sessions-secret-key.txt"),
  SESSIONS_MAX_TTL_MS: 7 * DAY,
  SESSIONS_TTL_MS: 7 * DAY,

  // VPN API
  VPN_API_RPC_URL: "http://vpn.dappnode:3000/rpc",

  // HTTPS Portal API URL
  HTTPS_PORTAL_API_URL: "http://https.dappnode:5000",
  HTTPS_PORTAL_DNPNAME: "https.dnp.dappnode.eth",
  HTTPS_PORTAL_ISCORE: true,
  HTTPS_PORTAL_MAIN_SERVICE: "https.dnp.dappnode.eth",
  HTTPS_PORTAL_LOCAL_PROXYING_ENVNAME: "LOCAL_PROXYING",

  // Wireguard params
  WIREGUARD_DNP_NAME: "wireguard.dnp.dappnode.eth",
  WIREGUARD_ISCORE: true,
  WIREGUARD_MAIN_SERVICE: "wireguard",
  /** api.wireguard.dappnode/:device */
  WIREGUARD_API_URL: "http://api.wireguard.dappnode",
  WIREGUARD_DEVICES_ENVNAME: "PEERS",

  // Docker compose parameters
  DNS_SERVICE: "172.33.1.2",
  DNP_PRIVATE_NETWORK_SUBNET: "172.33.0.0/16",
  DNP_PRIVATE_NETWORK_NAME: "dncore_network",
  DNP_PRIVATE_NETWORK_NAME_FROM_CORE: "network",
  DNP_EXTERNAL_NETWORK_NAME: "dnpublic_network",
  // Use of new compose file feature: network name
  MINIMUM_COMPOSE_VERSION: "3.5",

  CONTAINER_NAME_PREFIX: "DAppNodePackage-",
  CONTAINER_CORE_NAME_PREFIX: "DAppNodeCore-",
  CONTAINER_TOOL_NAME_PREFIX: "DAppNodeTool-",
  // Docker volume parameters
  MOUNTPOINT_DEVICE_PREFIX: "dappnode-volumes",

  // Auto-update parameters
  AUTO_UPDATE_DELAY: 1 * DAY,
  AUTO_UPDATE_INCLUDE_IPFS_VERSIONS: false,

  // Watchers
  AUTO_UPDATE_DAEMON_INTERVAL: 5 * MINUTE,
  CHECK_DISK_USAGE_DAEMON_INTERVAL: 1 * MINUTE,
  NAT_RENEWAL_DAEMON_INTERVAL: 1 * HOUR,
  NSUPDATE_DAEMON_INTERVAL: 1 * HOUR,

  // IPFS parameters
  IPFS_HOST: process.env.IPFS_HOST || process.env.IPFS_REDIRECT,
  IPFS_TIMEOUT: 0.5 * MINUTE,
  IPFS_LOCAL: "http://ipfs.dappnode:5001",
  IPFS_REMOTE: "https://gateway.ipfs.dappnode.io",

  // Web3 parameters
  ETH_MAINNET_RPC_URL_OVERRIDE: process.env.ETH_MAINNET_RPC_OVERRIDE,
  ETH_MAINNET_RPC_URL_REMOTE:
    process.env.ETH_MAINNET_RPC_URL_REMOTE || "https://web3.dappnode.net",
  ETH_MAINNET_CHECKPOINTSYNC_URL_REMOTE: "https://checkpoint-sync.dappnode.io",

  // Prysm legacy specs for: prater, gnosis and mainnet
  prysmLegacySpecs: [
    //  v0.2.46
    {
      prysmDnpName: "prysm-prater.dnp.dappnode.eth",
      prysmVersion: "0.1.7",
      web3signerDnpName: "web3signer-prater.dnp.dappnode.eth",
      incompatibleClientsDnpNames: [
        "teku-prater.dnp.dappnode.eth",
        "lighthouse-prater.dnp.dappnode.eth",
        "nimbus-prater.dnp.dappnode.eth",
        "lodestar-prater.dnp.dappnode.eth"
      ]
    },
    // v0.2.51
    {
      prysmDnpName: "gnosis-beacon-chain-prysm.dnp.dappnode.eth",
      prysmVersion: "0.1.8",
      web3signerDnpName: "web3signer-gnosis.dnp.dappnode.eth",
      incompatibleClientsDnpNames: [
        "teku-gnosis.dnp.dappnode.eth",
        "lighthouse-gnosis.dnp.dappnode.eth",
        "nimbus-gnosis.dnp.dappnode.eth",
        "lodestar-gnosis.dnp.dappnode.eth"
      ]
    },
    // v0.2.52
    {
      prysmDnpName: "prysm.dnp.dappnode.eth",
      prysmVersion: "1.0.25",
      web3signerDnpName: "web3signer.dnp.dappnode.eth",
      incompatibleClientsDnpNames: [
        "teku.dnp.dappnode.eth",
        "lighthouse.dnp.dappnode.eth",
        "nimbus.dnp.dappnode.eth",
        "lodestar.dnp.dappnode.eth"
      ]
    }
  ],

  // DAPPMANAGER alias
  DAPPMANAGER_ALIASES: ["my.dappnode", "dappnode.local"],

  // DAppNode specific names
  bindDnpName: "bind.dnp.dappnode.eth",
  coreDnpName: "core.dnp.dappnode.eth",
  dappmanagerDnpName: "dappmanager.dnp.dappnode.eth",
  dappmanagerContainerName: "DAppNodeCore-dappmanager.dnp.dappnode.eth",
  restartDnpName: "restart.dnp.dappnode.eth",
  vpnDnpName: "vpn.dnp.dappnode.eth",
  vpnContainerName: "DAppNodeCore-vpn.dnp.dappnode.eth",
  wifiDnpName: "wifi.dnp.dappnode.eth",
  wifiContainerName: "DAppNodeCore-wifi.dnp.dappnode.eth",
  ipfsDnpName: "ipfs.dnp.dappnode.eth",
  ipfsContainerName: "DAppNodeCore-ipfs.dnp.dappnode.eth",
  vpnDataVolume: "dncore_vpndnpdappnodeeth_data",
  restartContainerName: "DAppNodeTool-restart.dnp.dappnode.eth",
  restartDnpVolumes: [
    "/usr/src/dappnode/DNCORE/:/usr/src/app/DNCORE/",
    "/var/run/docker.sock:/var/run/docker.sock"
  ],
  corePackagesThatMustBeRunning: [
    "bind.dnp.dappnode.eth",
    "dappmanager.dnp.dappnode.eth"
  ],
  corePackagesNotAutoupdatable: [
    "core.dnp.dappnode.eth",
    "bind.dnp.dappnode.eth",
    "dappmanager.dnp.dappnode.eth",
    "ipfs.dnp.dappnode.eth",
    "wifi.dnp.dappnode.eth"
  ],
  corePackagesNotRemovable: [
    "bind.dnp.dappnode.eth",
    "dappmanager.dnp.dappnode.eth",
    "ipfs.dnp.dappnode.eth",
    "wifi.dnp.dappnode.eth"
  ],

  // DYNDNS parameters
  DYNDNS_HOST: "https://ns.dappnode.io",
  DYNDNS_DOMAIN: "dyndns.dappnode.io",
  DYNDNS_INTERVAL: 30 * 60 * 1000, // 30 minutes

  // Local domains
  AVAHI_LOCAL_DOMAIN: "dappnode.local",

  // System file paths
  HOSTNAME_PATH: "/etc/dappnodename",
  STATIC_IP_PATH: "/usr/src/app/config/static_ip",
  VPNDB_PATH: "/usr/src/app/secrets/vpndb.json",

  // Wi-Fi ENVs
  WIFI_KEY_SSID: "SSID",
  WIFI_KEY_PASSWORD: "WPA_PASSPHRASE",

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
    SERVER_NAME: "_DAPPNODE_GLOBAL_SERVER_NAME", // "MyDAppNode"
    CONSENSUS_CLIENT_MAINNET: "_DAPPNODE_GLOBAL_CONSENSUS_CLIENT_MAINNET", // "prysm.dnp.dappnode.eth"
    EXECUTION_CLIENT_MAINNET: "_DAPPNODE_GLOBAL_EXECUTION_CLIENT_MAINNET", // "geth.dnp.dappnode.eth"
    CONSENSUS_CLIENT_GNOSIS: "_DAPPNODE_GLOBAL_CONSENSUS_CLIENT_GNOSIS", // "teku-gnosis.dnp.dappnode.eth"
    EXECUTION_CLIENT_GNOSIS: "_DAPPNODE_GLOBAL_EXECUTION_CLIENT_GNOSIS", // "nethermind-xdai.dnp.dappnode.eth"
    CONSENSUS_CLIENT_PRATER: "_DAPPNODE_GLOBAL_CONSENSUS_CLIENT_PRATER", // "prysm-prater.dnp.dappnode.eth"
    EXECUTION_CLIENT_PRATER: "_DAPPNODE_GLOBAL_EXECUTION_CLIENT_PRATER", // "goerli-geth.dnp.dappnode.eth"
    CONSENSUS_CLIENT_LUKSO: "_DAPPNODE_GLOBAL_CONSENSUS_CLIENT_LUKSO", // "prysm-lukso.dnp.dappnode.eth"
    EXECUTION_CLIENT_LUKSO: "_DAPPNODE_GLOBAL_EXECUTION_CLIENT_LUKSO" // "lukso-geth.dnp.dappnode.eth"
  },
  // Global ENVs dappnode prefix
  GLOBAL_ENVS_PREFIX: "_DAPPNODE_GLOBAL_",

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
  // Default fullnode alias
  FULLNODE_ALIAS: "fullnode.dappnode",

  // ETHFORWARD / HTTP proxy params
  ETHFORWARD_IPFS_REDIRECT: "http://ipfs.dappnode:8080",
  ETHFORWARD_SWARM_REDIRECT: "http://swarm.dappnode",
  ETHFORWARD_PIN_ON_VISIT: true,

  // API endpoint check tcp ports. req: /publicIp?tcpPorts=8092,1194 | res: /[{tcpPort, status}]
  PORT_SCANNER_SERVICE_URL: "http://159.65.206.61:3030",

  // Flags
  DISABLE_UPNP: /true/i.test(process.env.DISABLE_UPNP || ""),
  AUTH_IP_ALLOW_LOCAL_IP: Boolean(process.env.AUTH_IP_ALLOW_LOCAL_IP),
  TEST: Boolean(process.env.TEST),

  DEFAULT_RELEASE_TRUSTED_KEYS: [
    {
      name: "DAppNode Association",
      dnpNameSuffix: ".dnp.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0xf35960302a07022aba880dffaec2fdd64d5bf1c1"
    },
    {
      name: "Nethermind Ethereum client team (public)",
      dnpNameSuffix: ".public.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0xbD404c6f101833b45fF45b80bEfBd17816376246"
    },
    {
      name: "Nethermind Ethereum client team (dnp)",
      dnpNameSuffix: ".dnp.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0xbD404c6f101833b45fF45b80bEfBd17816376246"
    },
    {
      name: "Lodestar Ethereum consensus client team",
      dnpNameSuffix: ".dnp.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0x9D055dd23de15114EC95921208c741873eDE8558"
    },
    {
      name: "ETC Cooperative",
      dnpNameSuffix: ".public.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0xfB737B2bb2067C3f9E1448AA2D70D32Db4fb51C4"
    }
  ]
};

if (devMode) {
  params.AUTO_UPDATE_DELAY = 3000;
  params.AUTO_UPDATE_DAEMON_INTERVAL = 1000;
  params.AUTO_UPDATE_INCLUDE_IPFS_VERSIONS = true;
}

export default params;

// Docker params
// Max port number (included) Otherwise it fails with
// Cannot create container for service ipfs.dnp.dappnode.eth: invalid port specification: "65536"
export const maxPortNumber = 65535;

/**
 * Link between an ethClientTarget keyword and its pacakge information
 * Declared above to use stronger typings
 */
export const ethClientData: {
  [P in EthClientTargetPackage]: {
    dnpName: string; // "geth.dnp.dappnode.eth"
    url?: string; // Only provide a URL if it's not "http://geth.dappnode:8545"
    version?: string;
    userSettings?: UserSettings;
  };
} = {
  geth: { dnpName: "geth.dnp.dappnode.eth" },
  nethermind: { dnpName: "nethermind.public.dappnode.eth" },
  besu: { dnpName: "besu.public.dappnode.eth" },
  erigon: { dnpName: "erigon.dnp.dappnode.eth" }
};

// Naming

export const getContainerName = ({
  dnpName,
  serviceName,
  isCore
}: {
  dnpName: string;
  serviceName: string;
  isCore: boolean;
}): string =>
  // Note: _PREFIX variables already end with the character "-"
  [
    isCore ? params.CONTAINER_CORE_NAME_PREFIX : params.CONTAINER_NAME_PREFIX,
    getContainerDomain({ dnpName, serviceName })
  ].join("");
