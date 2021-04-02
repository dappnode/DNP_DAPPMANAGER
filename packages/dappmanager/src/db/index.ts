export * from "./autoUpdateSettings";
export * from "./coreUpdate";
export * from "./dyndns";
export * from "./ethClient";
export * from "./fileTransferPath";
export * from "./network";
export * from "./notification";
export * from "./package";
export * from "./secrets";
export * from "./system";
export * from "./systemFlags";
export * from "./ui";
export * from "./upnp";
export * from "./vpn";
// Aditional low levels methods
import { lowLevel as lowLevelMainDb } from "./dbMain";
import { lowLevel as lowLevelCacheDb } from "./dbCache";

/**
 * Alias, General methods
 */
export const clearCache = lowLevelCacheDb.clearDb;

export const cleardb = lowLevelMainDb.clearDb;

// Aditional low levels methods
export { lowLevelMainDb, lowLevelCacheDb };
