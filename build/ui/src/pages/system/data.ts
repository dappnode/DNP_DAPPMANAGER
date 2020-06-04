// This will be used later in our root reducer and selectors

export const rootPath = "/system";
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
  update: "update",
  // Must be "add-ipfs-peer" for backwards compatibility with the previous IFPS peer links
  peers: "add-ipfs-peer",
  power: "power"
};

// Computed paths
export const activateFallbackPath = `${rootPath}/${subPaths.repository}`;

// DAppNode data
export const ipfsApiUrl = "http://ipfs.dappnode:5001/api/v0";
