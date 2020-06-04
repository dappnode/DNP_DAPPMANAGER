import { urlJoin } from "utils/url";

// JSON RPC API
export const apiUrl =
  process.env.REACT_APP_API_URL ||
  "http://my.dappmanager.dnp.dappnode.eth:3000/";
export const apiUrls = {
  rpc: urlJoin(apiUrl, "rpc"),
  upload: urlJoin(apiUrl, "upload"),
  download: urlJoin(apiUrl, "download"),
  containerLogs: urlJoin(apiUrl, "container-logs"),
  userActionLogs: urlJoin(apiUrl, "user-action-logs")
};

// WAMP
export const wampUrl = "ws://my.wamp.dnp.dappnode.eth:8080/ws";
export const wampRealm = "dappnode_admin";

// WIFI
export const wifiDefaultSSID = "DAppNodeWIFI";
export const wifiDefaultWPA_PASSPHRASE = "dappnode";
export const wifiEnvWPA_PASSPHRASE = "WPA_PASSPHRASE";
export const wifiEnvSSID = "SSID";

// DNP names
export const wifiName = "wifi.dnp.dappnode.eth";
export const ipfsName = "ipfs.dnp.dappnode.eth";
export const coreName = "core.dnp.dappnode.eth";
export const dappmanagerName = "dappmanager.dnp.dappnode.eth";

// NACL keys
export const adminNaclSecretKey =
  "DAppNodeDAppNodeDAppNodeDAppNodeDAppNodeDao=";
export const adminNaclPublicKey =
  "cYo1NA7/+PQ22PeqrRNGhs1B84SY/fuomNtURj5SUmQ=";

// TEMP TAGS
export const MOUNTPOINT_DEVICE_LEGACY_TAG = "legacy:";
export const USER_SETTING_DISABLE_TAG = "disable:";

// WEB3
export const fullnodeHttpJsonRpc = "http://fullnode.dappnode:8545";

// URLs / Links
export const surveyUrl = "https://goo.gl/forms/DSy1J1OlQGpdyhD22";
export const packageSurveyLink = "https://goo.gl/forms/EjVTHu6UBWBk60Z62";

// AutoUpdate IDSs
export const autoUpdateIds = {
  MY_PACKAGES: "my-packages",
  SYSTEM_PACKAGES: "system-packages"
};

// VPN
export const superAdminId = "dappnode_admin";

// Support, where to send issues
const githubRepo = "DNP_ADMIN";
const githubUsername = "dappnode";
export const issueBaseUrl = `https://github.com/${githubUsername}/${githubRepo}/issues/new`;
