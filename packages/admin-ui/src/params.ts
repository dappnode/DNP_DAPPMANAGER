import { urlJoin } from "utils/url";

// JSON RPC API
export const apiUrl = process.env.REACT_APP_API_URL || "http://my.dappnode/";
export const apiUrls = {
  ping: urlJoin(apiUrl, "ping"),

  // Auth routes
  loginStatus: urlJoin(apiUrl, "login-status"),
  login: urlJoin(apiUrl, "login"),
  logout: urlJoin(apiUrl, "logout"),
  register: urlJoin(apiUrl, "register"),
  changePass: urlJoin(apiUrl, "change-pass"),
  recoverPass: urlJoin(apiUrl, "recover-pass"),

  // Regular routes
  rpc: urlJoin(apiUrl, "rpc"),
  upload: urlJoin(apiUrl, "upload"),
  download: urlJoin(apiUrl, "download"),
  downloadWireguardConfig: urlJoin(apiUrl, "wireguard-config"),
  fileDownload: urlJoin(apiUrl, "file-download"),
  containerLogs: urlJoin(apiUrl, "container-logs"),
  userActionLogs: urlJoin(apiUrl, "user-action-logs")
};
export const socketIoUrl = apiUrl;

// Allow cross-domain cookies
export const apiTestMode = process.env.REACT_APP_API_TEST;

// API Auth errors. Must be in sync with the DAPPMANAGER
export const ERROR_NOT_REGISTERED = "NOT_REGISTERED";
export const ERROR_NOT_LOGGED_IN = "NOT_LOGGED_IN";
export const ERROR_NOT_LOGGED_IN_NO_COOKIE = "NOT_LOGGED_IN_NO_COOKIE";

// WIFI
export const wifiDefaultSSID = "DAppNodeWIFI";
export const wifiDefaultWPA_PASSPHRASE = "dappnode";
export const wifiEnvWPA_PASSPHRASE = "WPA_PASSPHRASE";
export const wifiEnvSSID = "SSID";

// Local proxying
export const adminUiLocalDomain = "http://dappnode.local";

// DNP names
export const httpsPortalDnpName = "https.dnp.dappnode.eth";
export const wireguardDnpName = "wireguard.dnp.dappnode.eth";
export const wifiDnpName = "wifi.dnp.dappnode.eth";
export const ipfsDnpName = "ipfs.dnp.dappnode.eth";
export const coreDnpName = "core.dnp.dappnode.eth";
export const bindDnpName = "bind.dnp.dappnode.eth";
export const vpnDnpName = "vpn.dnp.dappnode.eth";
export const dappmanagerDnpName = "dappmanager.dnp.dappnode.eth";
export const mandatoryCoreDnps = [
  dappmanagerDnpName,
  ipfsDnpName,
  bindDnpName
  // WIFI package is not mandatory to be running
  // wifiDnpName
];
export const corePackages = [...mandatoryCoreDnps, coreDnpName];

// NACL keys
export const adminNaclSecretKey =
  "DAppNodeDAppNodeDAppNodeDAppNodeDAppNodeDao=";
export const adminNaclPublicKey =
  "cYo1NA7/+PQ22PeqrRNGhs1B84SY/fuomNtURj5SUmQ=";

// URLs / Links
export const dappnodeGnosisCheckpointSync =
         "https://checkpoint-sync-gnosis.dappnode.io";
export const dappnodePraterCheckpointSync =
  "https://checkpoint-sync-prater.dappnode.io";
export const dappnodeMainnetCheckpointSync =
  "https://checkpoint-sync.dappnode.io";
export const dappnodeForumUrl = "https://forum.dappnode.io";
export const topicBaseUrl = `https://forum.dappnode.io/new-topic`;
export const discordInviteUrl = "https://discord.gg/dappnode";

export const sdkPublishAppUrl = "https://dappnode.github.io/sdk-publish/";
export const sdkGuideUrl = "https://github.com/dappnode/DAppNodeSDK";
export const githubNewIssueDappnodeUrl =
  "https://github.com/dappnode/DAppNode/issues/new";

export const surveyUrl = "https://goo.gl/forms/DSy1J1OlQGpdyhD22";
export const packageSurveyLink = "https://goo.gl/forms/EjVTHu6UBWBk60Z62";

export const docsUrl = {
  main: "https://docs.dappnode.io",
  recoverPasswordGuide:
    "https://docs.dappnode.io/user/faq/troubleshooting",
  connectWifi: "https://docs.dappnode.io/user/guides/access/wifi",
  connectLocalProxy:
    "https://docs.dappnode.io/user/guides/access/local",
  connectVpn: "https://docs.dappnode.io/user/guides/access/vpn",
  httpsExplanation: "https://docs.dappnode.io/user/product-manual/system#networkk",
  ipfsPeersExplanation:
    "https://docs.dappnode.io/user/product-manual/system#peers"
};

export const forumUrl = {
  telegramHowTo:
    "https://forum.dappnode.io/t/set-up-your-dappnode-telegram-bot/816/4",
  ipfsRemoteHowTo:
    "https://forum.dappnode.io/t/how-to-use-dappnode-ipfs-remote/1295",
  expandFileSystemHowTo:
    "https://forum.dappnode.io/t/how-to-expand-your-dappnode-filesystem-space/1296"
};

export const troubleShootMountpointsGuideUrl =
  "https://docs.dappnode.io/developers/package-dev/wizard#target";
export const dappnodeUserGuideUrl =
  "https://docs.dappnode.io/user/faq/general";
export const explorerTreasuryUrl = "https://sourcecred.dappnode.io/#/explorer";
export const dappnodeGithub = "https://github.com/dappnode/DAppNode";
export const dappnodeDiscourse = "https://forum.dappnode.io/";
export const dappnodeDiscord = "https://discord.gg/dappnode";

// AutoUpdate IDSs
export const autoUpdateIds = {
  MY_PACKAGES: "my-packages",
  SYSTEM_PACKAGES: "system-packages"
};

// LVM default dappnode values
export const dappnodeVolumeGroup = "rootvg";
export const dappnodeLogicalVolume = "root";

// IPFS
export const IPFS_DAPPNODE_GATEWAY = "https://gateway.ipfs.dappnode.io";
export const IPFS_GATEWAY_CHECKER =
  "https://ipfs.github.io/public-gateway-checker/";

// VPN
export const MAIN_ADMIN_NAME = "dappnode_admin";

// Support, where to send issues
