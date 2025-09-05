import path from "path";
import { Network } from "@dappnode/types";

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

export const params = {
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
  PRIVATE_KEY_PATH: path.join(DNCORE_DIR, ".identity.private.key"),
  // Host script paths
  HOST_SCRIPTS_DIR_FROM_HOST: path.join(HOST_HOME, "DNCORE/scripts/host"),
  HOST_SCRIPTS_DIR: "DNCORE/scripts/host",
  HOST_SCRIPTS_SOURCE_DIR: process.env.TEST ? "/app/packages/hostScriptsServices/hostScripts" : "hostScripts",
  // Host services paths
  HOST_SERVICES_DIR_FROM_HOST: path.join(HOST_HOME, "DNCORE/services/host"),
  HOST_SYSTEMD_DIR_FROM_HOST: "/etc/systemd/system",
  HOST_SERVICES_DIR: "DNCORE/services/host",
  HOST_SERVICES_SOURCE_DIR: process.env.TEST ? "/app/packages/hostScriptsServices/hostServices" : "hostServices",
  // Host timer paths
  HOST_TIMERS_DIR_FROM_HOST: path.join(HOST_HOME, "DNCORE/timers/host"),
  HOST_TIMERS_DIR: "DNCORE/timers/host",
  HOST_TIMERS_SOURCE_DIR: process.env.TEST ? "/app/packages/hostScriptsServices/hostTimers" : "hostTimers",
  // Local fallback versions, to be able to install and eth client without connecting to remote
  FALLBACK_VERSIONS_PATH: path.join(DNCORE_DIR, "packages-content-hash.csv"),
  // Version data file, created in the docker image build process
  GIT_DATA_PATH: process.env.GIT_DATA_PATH || ".git-data.json",
  // UI static files
  UI_FILES_PATH: process.env.UI_FILES_PATH || "dist",

  // Signature API
  SIGNATURE_PREFIX: "\x1dDappnode Signed Message:",

  // HTTP API parameters
  /** Use the internal ipfs gateway proxy so the UI works served from the HTTPs Portal */
  IPFS_GATEWAY: "/ipfs/",
  TEST_API_PORT: 7000,
  HTTP_API_PORT: process.env.HTTP_API_PORT || 80,
  HTTP_CORS_WHITELIST: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://my.dappnode",
    "http://my.dappnode.private",
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

  // Premium params
  PREMIUM_DNP_NAME: "premium.dnp.dappnode.eth",

  // Docker network parameters
  DOCKER_NETWORK_SUBNET: "172.33.0.0/16", // "10.20.0.0/24";
  DOCKER_PRIVATE_NETWORK_NAME: "dncore_network",
  DOCKER_NETWORK_NEW_SUBNET: "10.20.0.0/24",
  DOCKER_PRIVATE_NETWORK_NEW_NAME: "dnprivate_network",
  DOCKER_EXTERNAL_NETWORK_NAME: "dnpublic_network",
  DOCKER_STAKER_NETWORKS: {
    [Network.Mainnet]: "mainnet_network",
    [Network.Holesky]: "holesky_network",
    [Network.Hoodi]: "hoodi_network",
    [Network.Prater]: "prater_network",
    [Network.Gnosis]: "gnosis_network",
    [Network.Lukso]: "lukso_network"
  },
  DOCKER_LEGACY_DNS: "172.33.1.2",
  BIND_IP: "172.33.1.2",
  BIND_NEW_IP: "10.20.0.2",
  DAPPMANAGER_IP: "172.33.1.7",

  // Docker compose parameters
  // Use of new compose file feature: network name
  MINIMUM_COMPOSE_VERSION: "3.5",

  CONTAINER_NAME_PREFIX: "DAppNodePackage-",
  CONTAINER_CORE_NAME_PREFIX: "DAppNodeCore-",
  CONTAINER_TOOL_NAME_PREFIX: "DAppNodeTool-",
  // Docker volume parameters
  MOUNTPOINT_DEVICE_PREFIX: "dappnode-volumes",

  // Auto-update parameters
  AUTO_UPDATE_DELAY: 36 * HOUR,
  AUTO_UPDATE_DELAY_VARIATION: 12 * HOUR,
  AUTO_UPDATE_INCLUDE_IPFS_VERSIONS: false,

  // Watchers
  TEMPERATURE_DAEMON_INTERVAL: 5 * MINUTE,
  AUTO_UPDATE_DAEMON_INTERVAL: 30 * MINUTE,
  CHECK_DISK_USAGE_DAEMON_INTERVAL: 1 * MINUTE,
  NAT_RENEWAL_DAEMON_INTERVAL: 1 * HOUR,
  ETHICAL_METRICS_DAEMON_INTERVAL: 50 * MINUTE,
  BIND_DAEMON_INTERVAL: 10 * MINUTE, // TODO: after public ip range migration put a higher value

  // IPFS parameters
  IPFS_HOST: process.env.IPFS_HOST || process.env.IPFS_REDIRECT,
  IPFS_TIMEOUT: 0.5 * MINUTE,
  IPFS_LOCAL: "http://ipfs.dappnode:8080",
  IPFS_REMOTE: "https://gateway.ipfs.dappnode.io",

  // Web3 parameters
  ETH_MAINNET_RPC_URL_OVERRIDE: process.env.ETH_MAINNET_RPC_OVERRIDE,
  ETH_MAINNET_RPC_URL_REMOTE: process.env.ETH_MAINNET_RPC_URL_REMOTE || "https://web3.dappnode.net",
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
  DAPPMANAGER_ALIASES: ["dappmanager.dappnode", "my.dappnode", "dappnode.local"],
  DAPPMANAGER_NEW_ALIASES: ["dappmanager.dappnode.private", "my.dappnode.private", "dappnode.local"],

  // DAppNode specific names
  bindDnpName: "bind.dnp.dappnode.eth",
  bindContainerName: "DAppNodeCore-bind.dnp.dappnode.eth",
  coreDnpName: "core.dnp.dappnode.eth",
  dappmanagerDnpName: "dappmanager.dnp.dappnode.eth",
  dappmanagerContainerName: "DAppNodeCore-dappmanager.dnp.dappnode.eth",
  httpsContainerName: "DAppNodeCore-https.dnp.dappnode.eth",
  restartDnpName: "restart.dnp.dappnode.eth",
  vpnDnpName: "vpn.dnp.dappnode.eth",
  vpnContainerName: "DAppNodeCore-vpn.dnp.dappnode.eth",
  wifiDnpName: "wifi.dnp.dappnode.eth",
  wifiContainerName: "DAppNodeCore-wifi.dnp.dappnode.eth",
  ipfsDnpName: "ipfs.dnp.dappnode.eth",
  ipfsContainerName: "DAppNodeCore-ipfs.dnp.dappnode.eth",
  notificationsDnpName: "notifications.dnp.dappnode.eth",
  vpnDataVolume: "dncore_vpndnpdappnodeeth_data",
  wireguardContainerName: "DAppNodeCore-wireguard.wireguard.dnp.dappnode.eth",
  restartContainerName: "DAppNodeTool-restart.dnp.dappnode.eth",
  restartDnpVolumes: ["/usr/src/dappnode/DNCORE/:/usr/src/app/DNCORE/", "/var/run/docker.sock:/var/run/docker.sock"],
  corePackagesThatMustBeRunning: ["bind.dnp.dappnode.eth", "dappmanager.dnp.dappnode.eth"],
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
  WIFI_DEFAULT_PASSWORD: "dappnode",

  // Global ENVs dappnode prefix
  GLOBAL_ENVS_PREFIX: "_DAPPNODE_GLOBAL_",

  // nsenter line to run commands on host
  NSENTER_COMMAND: "docker run --rm --privileged --pid=host -t alpine:3.8 nsenter -t 1 -m -u -n -i",

  // Use a deterministic predefined key for the ADMIN side (DAPPMANAGER's is generated)
  ADMIN_NACL_SECRET_KEY: "DAppNodeDAppNodeDAppNodeDAppNodeDAppNodeDao=",
  ADMIN_NACL_PUBLIC_KEY: "cYo1NA7/+PQ22PeqrRNGhs1B84SY/fuomNtURj5SUmQ=",

  // Fullnode names
  ALLOWED_FULLNODE_DNP_NAMES: ["geth.dnp.dappnode.eth", "parity.dnp.dappnode.eth"],
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
      name: "DAppNode Association (dnp)",
      dnpNameSuffix: ".dnp.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0xf35960302a07022aba880dffaec2fdd64d5bf1c1"
    },
    {
      name: "DAppNode Association (public)",
      dnpNameSuffix: ".public.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0xf35960302a07022aba880dffaec2fdd64d5bf1c1"
    },
    {
      name: "Nethermind Ethereum client team (public)",
      dnpNameSuffix: ".public.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0xA6264173430bd3FdFF7414c617CBa299d85661E6"
    },
    {
      name: "Nethermind Ethereum client team (dnp)",
      dnpNameSuffix: ".dnp.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0xA6264173430bd3FdFF7414c617CBa299d85661E6"
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
    },
    {
      name: "Besu Ethereum client team (public)",
      dnpNameSuffix: ".public.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0xD88457e1B6e304900190b4a74f3c7D9a89896dBA"
    },
    {
      name: "Besu Ethereum client team (dnp)",
      dnpNameSuffix: ".dnp.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0xD88457e1B6e304900190b4a74f3c7D9a89896dBA"
    },
    {
      name: "Mgarciate",
      dnpNameSuffix: ".public.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0x86C4C5D83Ae936d32Ce46E8F256eC382A4F111d6"
    },
    {
      name: "Mgarciate",
      dnpNameSuffix: ".dnp.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0x86C4C5D83Ae936d32Ce46E8F256eC382A4F111d6"
    },
    {
      name: "HOPR Team",
      dnpNameSuffix: ".public.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0x7305356ad936A06c4ea5DF45AD5E5C3ff9Db818E"
    },
    {
      name: "Gnosis Team",
      dnpNameSuffix: ".dnp.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0x2BdB9b9b477268C1e7C04459F79DCc22401BBcd1"
    },
    {
      name: "Blockswap Labs",
      dnpNameSuffix: ".public.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0xF84eeDc34257018Ba77353b9F5b3e11AeAeecC2a"
    },
    {
      name: "LUKSO Team",
      dnpNameSuffix: ".dnp.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0x6109dcd72b8a2485A5b3Ac4E76965159e9893aB7"
    },
    {
      name: "Lighthouse Team",
      dnpNameSuffix: ".dnp.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0xad734Bef91920621B3D2cb30E0f65461e324647E"
    },
    {
      name: "Swarm Team",
      dnpNameSuffix: ".public.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0xdAD64d07A318476dc48257a0bB53a8e9a26C6B33"
    },
    {
      name: "Bertho - Nektar Network",
      dnpNameSuffix: ".public.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0x837a04322815b008c3e60c864bd5712e1da468b0"
    },
    {
      name: "Shutter Network",
      dnpNameSuffix: ".dnp.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0x30eFb96763f07892d0E2f7E900c672d43A202E61"
    },
    {
      name: "ethPandaOps",
      dnpNameSuffix: ".public.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0x67e5fEB0F1d184cC189614d8903ABcadD677c1E0"
    },
    {
      name: "Dappnode Association - Pol (dnp)",
      dnpNameSuffix: ".dnp.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0x18eE60706Ed150f6E21D020C1Cede55E4267f409"
    },
    {
      name: "Dappnode Association - Pol (public)",
      dnpNameSuffix: ".public.dappnode.eth",
      signatureProtocol: "ECDSA_256" as const,
      key: "0x18eE60706Ed150f6E21D020C1Cede55E4267f409"
    }
  ]
};

if (devMode) {
  params.AUTO_UPDATE_DELAY = 3000;
  params.AUTO_UPDATE_DAEMON_INTERVAL = 1000;
  params.AUTO_UPDATE_INCLUDE_IPFS_VERSIONS = true;
}
