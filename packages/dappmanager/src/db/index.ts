export * from "./autoUpdateSettings";
export * from "./coreUpdate";
export * from "./counterViews";
export * from "./dyndns";
export * from "./ethClient";
export * from "./ipfsClient";
export * from "./fileTransferPath";
export * from "./network";
export * from "./notification";
export * from "./package";
export * from "./registry";
export * from "./releaseKeys";
export * from "./secrets";
export * from "./stakerConfig";
export * from "./system";
export * from "./systemFlags";
export * from "./ui";
export * from "./upnp";
export * from "./vpn";
export * from "./stakerConfig";
// Aditional low levels methods
import { dbCache, dbMain } from "./dbFactory";

/** WARNING! Only clear cache DB if necessary */
export const clearCacheDb = dbCache.clearDb;
/** DANGER! Calling this method will loose user data */
export const clearMainDb = dbMain.clearDb;
