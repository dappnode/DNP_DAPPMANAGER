import {
  autoUpdatePending,
  autoUpdateRegistry,
  autoUpdateSettings
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
// Aditional low levels methods
import { clearDb } from "./lowLevelDb";

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
  // Aditional low levels methods
  clearDb
};
