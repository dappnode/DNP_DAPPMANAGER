// This will be used later in our root reducer and selectors
export const pathName = "system";
export const relativePath = pathName + "/info"; // default redirect to info
export const rootPath = pathName + "/*";
export const title = "System";

// Aditional data

// Sub-paths
export const subPaths = {
  info: "info",
  identity: "identity",
  security: "security",
  autoUpdates: "auto-updates",
  repository: "repository",
  staticIp: "static-ip",
  network: "network",
  update: "update",
  // Must be "add-ipfs-peer" for backwards compatibility with the previous IFPS peer links
  peers: "add-ipfs-peer",
  power: "power",
  profile: "profile",
  notifications: "notifications",
  advanced: "advanced",
  hardware: "hardware"
};

// Computed paths
export const activateFallbackPath = `${pathName}/${subPaths.repository}`;
export const systemProfilePath = `${pathName}/${subPaths.profile}`;

// DAppNode data
export const ipfsApiUrl = "http://ipfs.dappnode:5001/api/v0";
export const ipfsGatewayUrl = "http://ipfs.dappnode:8080";
