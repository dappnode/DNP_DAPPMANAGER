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
export * from "./registry";
// Aditional low levels methods
import { dbCache, dbMain } from "./dbFactory";

/** WARNING! Only clear cache DB if necessary */
export const clearCacheDb = dbCache.clearDb;
/** DANGER! Calling this method will loose user data */
export const clearMainDb = dbMain.clearDb;
