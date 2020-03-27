export * from "./autoUpdateSettings";
export * from "./cache";
export * from "./dyndns";
export * from "./ethClient";
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
import { AUTO_UPDATE_SETTINGS, autoUpdateSettings } from "./autoUpdateSettings";
import { isEmpty } from "lodash";

/**
 * Migrate keys to the new DB
 */
function migrateToNewMainDb(): void {
  // AUTO_UPDATE_SETTINGS
  // Migrate ONLY if there are settings in the old DB
  const autoUpdateSettingsValue = lowLevelCacheDb.get(AUTO_UPDATE_SETTINGS);
  if (autoUpdateSettingsValue && !isEmpty(autoUpdateSettingsValue)) {
    autoUpdateSettings.set(autoUpdateSettingsValue);
    lowLevelCacheDb.del(AUTO_UPDATE_SETTINGS);
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
