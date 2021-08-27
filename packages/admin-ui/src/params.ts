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
export const dappnodeForumUrl = "https://forum.dappnode.io";
export const topicBaseUrl = `https://forum.dappnode.io/new-topic`;
export const discordInviteUrl = "https://discord.gg/c28an8dA5k";

export const sdkPublishAppUrl = "https://dappnode.github.io/sdk-publish/";
export const sdkGuideUrl = "https://github.com/dappnode/DAppNodeSDK";
export const githubNewIssueDappnodeUrl =
  "https://github.com/dappnode/DAppNode/issues/new";

export const surveyUrl = "https://goo.gl/forms/DSy1J1OlQGpdyhD22";
export const packageSurveyLink = "https://goo.gl/forms/EjVTHu6UBWBk60Z62";

export const docsUrl = {
  recoverPasswordGuide:
    "https://docs.dappnode.io/user-guide/support/troubleshooting#recover-ui-password",
  connectWifi: "https://docs.dappnode.io/user-guide/ui/access/wifi",
  connectLocalProxy:
    "https://docs.dappnode.io/user-guide/ui/access/local-proxy",
  connectVpn: "https://docs.dappnode.io/user-guide/ui/access/vpn",
  httpsExplanation: "https://docs.dappnode.io/user-guide/ui/system#network",
  ipfsPeersExplanation:
    "https://docs.dappnode.io/user-guide/ui/recommended-set-ups/add-ipfs-peers"
};

export const setupTelegramBotGuideUrl =
  "https://forum.dappnode.io/t/set-up-your-dappnode-telegram-bot/816/4";
export const troubleShootMountpointsGuideUrl =
  "https://github.com/dappnode/DAppNode/wiki/Troubleshoot-mountpoints";
export const dappnodeUserGuideUrl =
  "https://dappnode.github.io/DAppNodeDocs/what-can-you-do/";
export const mediumTreasuryUrl =
  "https://medium.com/dappnode/dappnodes-community-treasury-b47ac2bb87f2";
export const explorerTreasuryUrl = "https://sourcecred.dappnode.io/#/explorer";
export const dappnodeGitcoin =
  "https://gitcoin.co/grants/143/dappnode-panvala-league";
export const dappnodeGithub = "https://github.com/dappnode/DAppNode";
export const dappnodeDiscourse = "https://forum.dappnode.io/";
export const dappnodeDiscord = "https://discord.gg/c28an8dA5k";

// AutoUpdate IDSs
export const autoUpdateIds = {
  MY_PACKAGES: "my-packages",
  SYSTEM_PACKAGES: "system-packages"
};

// VPN
export const MAIN_ADMIN_NAME = "dappnode_admin";

// Support, where to send issues
