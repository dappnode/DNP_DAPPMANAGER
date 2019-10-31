import {
  autoUpdatePending,
  autoUpdateRegistry,
  autoUpdateSettings,
  AUTO_UPDATE_SETTINGS
} from "./autoUpdateSettings";
import { composeCache, apmCache, ipfsCache, manifestCache } from "./cache";
import { fileTransferPath } from "./fileTransferPath";
import { notification, notifications } from "./notification";
import { upnpAvailable, upnpPortMappings, portsToOpen } from "./upnp";
import {
  areEnvFilesMigrated,
  importedInstallationStaticIp,
  isVpnDbMigrated
} from "./systemFlags";
import { publicIp, domain, dyndnsIdentity, staticIp } from "./dyndns";
import { serverName } from "./system";
import {
  noNatLoopback,
  doubleNat,
  alertToOpenPorts,
  internalIp
} from "./network";
import { naclSecretKey, naclPublicKey, identityAddress } from "./secrets";
// Aditional low levels methods
import { lowLevel as lowLevelMainDb } from "./dbMain";
import { lowLevel as lowLevelCacheDb } from "./dbCache";

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
  autoUpdatePending,
  autoUpdateRegistry,
  autoUpdateSettings,
  composeCache,
  apmCache,
  ipfsCache,
  manifestCache,
  fileTransferPath,
  notification,
  notifications,
  upnpAvailable,
  upnpPortMappings,
  portsToOpen,
  areEnvFilesMigrated,
  publicIp,
  domain,
  dyndnsIdentity,
  staticIp,
  importedInstallationStaticIp,
  isVpnDbMigrated,
  serverName,
  noNatLoopback,
  doubleNat,
  alertToOpenPorts,
  internalIp,
  naclSecretKey,
  naclPublicKey,
  identityAddress,
  // Aditional low levels methods
  lowLevelMainDb,
  lowLevelCacheDb,
  // General methods
  clearCache,
  migrateToNewMainDb
};
