import params from "./params";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import * as validate from "./utils/validate";
import {
  PackageNotification,
  AutoUpdateSettings,
  AutoUpdatePending,
  AutoUpdateRegistry,
  PackagePort,
  ApmVersion,
  Manifest,
  Compose
} from "./types";
import { UpnpPortMapping } from "./modules/upnpc/types";
import semver from "semver";

// Define dbPath and make sure it exists (mkdir -p)
const dbPath = params.DB_PATH || "./dappmanagerdb.json";
validate.path(dbPath);

// Initialize db
const adapter = new FileSync(dbPath);
const db = low(adapter);

// DB returns are of unkown type. External methods below are typed
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function get(key: string): any | null {
  if (key) return db.get(formatKey(key)).value();
}

// DB returns are of unkown type. External methods below are typed
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function set(key: string, value: any): void {
  return db.set(formatKey(key), value).write();
}

// Format keys to make sure they are consistent
function formatKey(key: string): string {
  // Check if key exist before calling String.prototype
  if (!key) return key;
  if (key.includes("ipfs/")) return key.split("ipfs/")[1];
  return key;
}

export function remove(key: string): void {
  db.unset(formatKey(key)).write();
}

export function clearDb(): void {
  db.setState({});
}

// DB returns are of unkown type. External methods below are typed
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function getEntireDb(): any {
  return Object.freeze(JSON.parse(JSON.stringify(db.getState())));
}

/**
 * Named methods, to allow typing
 */

export const AUTO_UPDATE_SETTINGS = "auto-update-settings";
export const AUTO_UPDATE_REGISTRY = "auto-update-registry";
export const AUTO_UPDATE_PENDING = "auto-update-pending";

// IPFS Cache
/////////////

const getManifestCacheKey = (hash: string): string => `manifest-${hash}`;
export function setManifestCache(hash: string, manifest: Manifest): void {
  set(getManifestCacheKey(hash), manifest);
}
export function getManifestCache(hash: string): Manifest | null {
  return get(getManifestCacheKey(hash));
}

const getComposeCacheKey = (hash: string): string => `compose-${hash}`;
export function setComposeCache(hash: string, compose: Compose): void {
  set(getComposeCacheKey(hash), compose);
}
export function getComposeCache(hash: string): Compose | null {
  return get(getComposeCacheKey(hash));
}

export function setIpfsCache(hash: string, content: string): void {
  set(hash, content);
}
export function getIpfsCache(hash: string): string | null {
  return get(hash);
}

// APM Cache
////////////

// DB key CANNOT be 0.1.0 as that would mean {0: {1: {0: {}}}
// apmCacheKey = goerli-pantheon-dnp-dappnode-eth-0-1-0
const getApmCacheKey = (name: string, ver: string): string =>
  `${name}-${ver}`.split(".").join("-");
export function setApmCache(
  name: string,
  ver: string,
  apmVersion: ApmVersion
): void {
  // Only store if the key is valid
  if (name && semver.valid(ver)) set(getApmCacheKey(name, ver), apmVersion);
}
export function getApmCache(name: string, ver: string): ApmVersion | null {
  return get(getApmCacheKey(name, ver));
}

// FIle transfer paths
//////////////////////

export function setFileTransferPath(fileId: string, filePath: string): void {
  set(fileId, filePath);
}
export function getFileTransferPath(fileId: string): string | null {
  return get(fileId);
}

// Notification DB
//////////////////

const NOTIFICATION = "notification";

export function setNotification(
  id: string,
  notification: PackageNotification
): void {
  set(`${NOTIFICATION}.${id}`, notification);
}
export function getNotifications(): { [id: string]: PackageNotification } {
  return get(NOTIFICATION) || {};
}

// AutoUpdate methods
/////////////////////

export function setAutoUpdateSettings(
  autoUpdateSettings: AutoUpdateSettings
): void {
  set(AUTO_UPDATE_SETTINGS, autoUpdateSettings);
}
export function getAutoUpdateSettings(): AutoUpdateSettings {
  return get(AUTO_UPDATE_SETTINGS) || {};
}

export function setAutoUpdatePending(
  autoUpdatePending: AutoUpdatePending
): void {
  set(AUTO_UPDATE_PENDING, autoUpdatePending);
}
export function getAutoUpdatePending(): AutoUpdatePending {
  return get(AUTO_UPDATE_PENDING) || {};
}

export function setAutoUpdateRegistry(
  autoUpdateRegistry: AutoUpdateRegistry
): void {
  set(AUTO_UPDATE_REGISTRY, autoUpdateRegistry);
}
export function getAutoUpdateRegistry(): AutoUpdateRegistry {
  return get(AUTO_UPDATE_REGISTRY) || {};
}

// UPnP, and ports info
///////////////////////

const UPNP_AVAILABLE = "upnpAvailable";
const UPNP_PORT_MAPPINGS = "upnpPortMappings";
const PORTS_TO_OPEN = "portsToOpen";

export function setUpnpAvailable(upnpAvailable: boolean): void {
  set(UPNP_AVAILABLE, upnpAvailable);
}
export function getUpnpAvailable(): boolean {
  return get(UPNP_AVAILABLE) || false;
}

export function setUpnpPortMappings(upnpPortMappings: UpnpPortMapping[]): void {
  set(UPNP_PORT_MAPPINGS, upnpPortMappings);
}
export function getUpnpPortMappings(): UpnpPortMapping[] {
  return get(UPNP_PORT_MAPPINGS) || [];
}

export function setPortsToOpen(portsToOpen: PackagePort[]): void {
  set(PORTS_TO_OPEN, portsToOpen);
}
export function getPortsToOpen(): PackagePort[] {
  return get(PORTS_TO_OPEN) || [];
}

// Additional system info
/////////////////////////

const ARE_ENV_FILES_MIGRATED = "areEnvFilesMigrated";

export function setAreEnvFilesMigrated(areEnvFilesMigrated: boolean): void {
  set(ARE_ENV_FILES_MIGRATED, areEnvFilesMigrated);
}
export function getAreEnvFilesMigrated(): boolean {
  return get(ARE_ENV_FILES_MIGRATED);
}
