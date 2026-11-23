export * from "./autoUpdateSettings.js";
export * from "./coreUpdate.js";
export * from "./counterViews.js";
export * from "./dyndns.js";
export * from "./ethicalMetrics.js";
export * from "./ipfsClient.js";
export * from "./mirrorProvider.js";
export * from "./fileTransferPath.js";
export * from "./mcp.js";
export * from "./network.js";
export * from "./nexus.js";
export * from "./notification.js";
export * from "./optimismConfig.js";
export * from "./package.js";
export * from "./releaseKeys.js";
export * from "./stakerConfig.js";
export * from "./system.js";
export * from "./systemFlags.js";
export * from "./ui.js";
export * from "./upnp.js";
export * from "./vpn.js";
export * from "./stakerConfig.js";
// Additional low levels methods
import { dbCache, dbMain, dbNexus } from "./dbFactory.js";
// Additional envs methods
export { computeGlobalEnvsFromDb, writeGlobalEnvsToEnvFile } from "./globalEnvs.js";

/** WARNING! Only clear cache DB if necessary */
export const clearCacheDb = dbCache.clearDb;
/** WARNING! Clears Nexus chat history and any future Nexus-scoped data */
export const clearNexusDb = dbNexus.clearDb;
/** DANGER! Calling this method will loose user data */
export const clearMainDb = dbMain.clearDb;
/** Raw snapshots of the DBs, used by full backups */
export const readMainDbRaw = dbMain.readAll;
export const readCacheDbRaw = dbCache.readAll;
export const readNexusDbRaw = dbNexus.readAll;
/** Raw multi-key writes, used by full backup restore. Bypass setter side effects */
export const writeMainDbKeysRaw = dbMain.writeKeys;
export const writeCacheDbKeysRaw = dbCache.writeKeys;
export const writeNexusDbKeysRaw = dbNexus.writeKeys;
