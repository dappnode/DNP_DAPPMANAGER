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
  network: "network",
  update: "update",
  power: "power",
  profile: "profile",
  notifications: "notifications",
  advanced: "advanced",
  hardware: "hardware"
};

// Computed paths
export const activateFallbackPath = `${rootPath}/${subPaths.repository}`;
export const systemProfilePath = `${rootPath}/${subPaths.profile}`;
