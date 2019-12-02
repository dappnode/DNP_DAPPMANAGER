export * from "./autoUpdateSettings";
export * from "./cache";
export * from "./dyndns";
export * from "./fileTransferPath";
export * from "./isInstalling";
export * from "./network";
export * from "./notification";
export * from "./package";
export * from "./secrets";
export * from "./system";
export * from "./systemFlags";
export * from "./upnp";
// Aditional low levels methods
import { lowLevel as lowLevelMainDb } from "./dbMain";
import { lowLevel as lowLevelCacheDb } from "./dbCache";
// For migrate
import { AUTO_UPDATE_SETTINGS } from "./autoUpdateSettings";

/**
 * Migrate keys to the new DB
 * - AUTO_UPDATE_SETTINGS
 * - ARE_ENV_FILES_MIGRATED (is ommited)
 */
const dbKeysToMigrate = [AUTO_UPDATE_SETTINGS];
function migrateToNewMainDb(): void {
  for (const key of dbKeysToMigrate) {
    lowLevelMainDb.set(key, lowLevelCacheDb.get(key));
    lowLevelCacheDb.del(key);
  }
}

/**
 * Alias
 */
const clearCache = lowLevelCacheDb.clearDb;

export {
  // Aditional low levels methods
  lowLevelMainDb,
  lowLevelCacheDb,
  // General methods
  clearCache,
  migrateToNewMainDb
};
