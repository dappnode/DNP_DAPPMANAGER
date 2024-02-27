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
export const ethicalMetricsDnpName = "ethical-metrics.dnp.dappnode.eth";
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

// URLs / Links
export const stakehouseLsdUrl = "https://l.linklyhq.com/l/1mPRE";
export const dappnodeForumUrl = "https://forum.dappnode.io";
export const topicBaseUrl = `https://forum.dappnode.io/new-topic`;
export const discordInviteUrl = "https://discord.gg/dappnode";

export const sdkPublishAppUrl = "https://dappnode.github.io/sdk-publish/";
export const sdkGuideUrl = "https://github.com/dappnode/DAppNodeSDK";
export const githubNewIssueDappnodeUrl =
  "https://github.com/dappnode/DAppNode/issues/new";

export const surveyUrl = "https://goo.gl/forms/DSy1J1OlQGpdyhD22";
export const packageSurveyLink = "https://goo.gl/forms/EjVTHu6UBWBk60Z62";

// smooth
export const mainSmooth = "https://smooth.dappnode.io/";
export const docsSmooth = "https://docs.dappnode.io/docs/smooth/";
export const brainSmooth = "http://brain.web3signer.dappnode/";

const docsBaseUrl = "https://docs.dappnode.io";

export const docsUrl = {
  main: docsBaseUrl,
  recoverPasswordGuide: `${docsBaseUrl}/docs/user/getting-started/register#troubleshooting`,
  connectToRouter: `${docsBaseUrl}/docs/user/getting-started/connect-dappnode-to-the-router`,
  connectWifi: `${docsBaseUrl}/docs/user/access-your-dappnode/wifi`,
  connectLocalProxy: `${docsBaseUrl}/docs/user/access-your-dappnode/local`,
  connectVpn: `${docsBaseUrl}/docs/user/access-your-dappnode/vpn/overview`,
  httpsExplanation: `${docsBaseUrl}`, // TODO: Add link to HTTPS page in docs when it's ready
  ipfsPeersExplanation: `${docsBaseUrl}`, // TODO: Add link to IPFS page in docs when it's ready
  stakers: `${docsBaseUrl}/docs/user/staking/overview`,
  rollups: `${docsBaseUrl}/docs/user/rollups/overview`,
  ethicalMetricsOverview: `${docsBaseUrl}/docs/user/ethical-metrics/overview`
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
export const dappnodeUserGuideUrl = "https://docs.dappnode.io/user/faq/general";
export const explorerGitcoinUrl =
  "https://explorer.gitcoin.co/#/round/1/0xdf22a2c8f6ba9376ff17ee13e6154b784ee92094/0xdf22a2c8f6ba9376ff17ee13e6154b784ee92094-17";
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
