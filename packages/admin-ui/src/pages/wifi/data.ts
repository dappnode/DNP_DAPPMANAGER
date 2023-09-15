// This will be used later in our root reducer and selectors
export const relativePath = "wireless-network/wifi"; // default redirect to wifi
export const rootPath = "wireless-network/*";
export const title = "Wi-Fi";

// Additional data

// SubPaths
export const wifiCredentialsSubpath = "/credentials";
export const wifiCredentialsPath = rootPath + wifiCredentialsSubpath;

export const subPaths = {
  wifi: "wifi",
  local: "local"
};
