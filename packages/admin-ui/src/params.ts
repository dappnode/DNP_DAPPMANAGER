import { urlJoin } from "utils/url";

// JSON RPC API
export const apiUrl =
  process.env.REACT_APP_API_URL || "http://my.dappmanager.dnp.dappnode.eth/";
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
  fileDownload: urlJoin(apiUrl, "file-download"),
  containerLogs: urlJoin(apiUrl, "container-logs"),
  userActionLogs: urlJoin(apiUrl, "user-action-logs")
};
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

// DNP names
export const wifiDnpName = "wifi.dnp.dappnode.eth";
export const ipfsDnpName = "ipfs.dnp.dappnode.eth";
export const coreDnpName = "core.dnp.dappnode.eth";
export const bindDnpName = "bind.dnp.dappnode.eth";
export const vpnDnpName = "vpn.dnp.dappnode.eth";
export const dappmanagerDnpName = "dappmanager.dnp.dappnode.eth";
export const mandatoryCoreDnps = [
  dappmanagerDnpName,
  vpnDnpName,
  ipfsDnpName,
  bindDnpName
  // WIFI package is not mandatory to be running
  // wifiDnpName
];
export const corePackages = [...mandatoryCoreDnps, coreDnpName];
// Container names
export const wifiContainerName = "DAppNodeCore-wifi.dnp.dappnode.eth";

// NACL keys
export const adminNaclSecretKey =
  "DAppNodeDAppNodeDAppNodeDAppNodeDAppNodeDao=";
export const adminNaclPublicKey =
  "cYo1NA7/+PQ22PeqrRNGhs1B84SY/fuomNtURj5SUmQ=";

// URLs / Links
export const surveyUrl = "https://goo.gl/forms/DSy1J1OlQGpdyhD22";
export const packageSurveyLink = "https://goo.gl/forms/EjVTHu6UBWBk60Z62";
export const sdkPublishAppUrl = "https://dappnode.github.io/sdk-publish/";
export const sdkGuideUrl = "https://github.com/dappnode/DAppNodeSDK";
export const recoverPasswordGuideUrl =
  "https://dappnode.github.io/DAppNodeDocs/troubleshooting/#recover-password";

// AutoUpdate IDSs
export const autoUpdateIds = {
  MY_PACKAGES: "my-packages",
  SYSTEM_PACKAGES: "system-packages"
};

// VPN
export const MAIN_ADMIN_NAME = "dappnode_admin";

// Support, where to send issues
export const topicBaseUrl = `https://forum.dappnode.io/new-topic`;
