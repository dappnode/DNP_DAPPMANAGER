/**
 * Classification of every dappmanager DB key for full backups.
 *
 * Only keys listed as included are copied into a backup. Restore decides
 * later which categories to apply (identity only on an exact clone).
 * A unit test fails when a key is added to packages/db without being listed
 * here, so new state is never silently left out of (or into) backups.
 */

export type BackupDbKeyCategory = "settings" | "identity" | "staker";

/** maindb.json keys copied into the backup, by category */
export const mainDbIncludedKeys: Record<string, BackupDbKeyCategory> = {
  // User settings
  "auto-update-settings": "settings",
  notifications: "settings", // Ethical metrics config
  "ipfs-client-target": "settings",
  "ipfs-gateway": "settings",
  "ipfs-gateways": "settings",
  "mcp-api-key": "settings",
  "mcp-mutating-tools-enabled": "settings",
  "mirror-provider-enabled": "settings",
  "nexus-api-key": "settings",
  "nexus-managed-api-key": "settings",
  "nexus-private-mode": "settings",
  "op-execution-client": "settings",
  "op-enable-historical-rpc": "settings",
  "release-keys-trusted": "settings",
  "telegram-status": "settings",
  "telegram-token": "settings",
  "telegram-channel-id": "settings",
  "telegram-user-id": "settings",
  "dappnode-web-name": "settings",
  "new-feature-status": "settings",
  "smooth-shown": "settings",
  "ui-telemetry-consent": "settings",
  // Restoring true prevents re-importing the identity from a legacy VPN DB
  "is-vpn-db-migrated": "settings",

  // Machine identity, applied only when restoring an exact clone
  "dyndns-identity": "identity",
  domain: "identity",
  "static-ip": "identity",

  // Staker selections, applied after the selected packages are restored
  "consensus-client-mainnet": "staker",
  "execution-client-mainnet": "staker",
  "mevboost-mainnet": "staker",
  "consensus-client-gnosis": "staker",
  "execution-client-gnosis": "staker",
  "mevboost-gnosis": "staker",
  "consensus-client-hoodi": "staker",
  "execution-client-hoodi": "staker",
  "mevboost-hoodi": "staker",
  "consensus-client-sepolia": "staker",
  "execution-client-sepolia": "staker",
  "mevboost-sepolia": "staker",
  "consensus-client-lukso": "staker",
  "execution-client-lukso": "staker",
  "mevboost-lukso": "staker",
  "consensus-staker-mainnet": "staker",
  "execution-staker-mainnet": "staker",
  "mevboost-staker-mainnet": "staker",
  "consensus-staker-sepolia": "staker",
  "execution-staker-sepolia": "staker",
  "mevboost-staker-sepolia": "staker"
};

/** maindb.json keys deliberately left out, with the reason */
export const mainDbExcludedKeys: Record<string, string> = {
  "public-ip": "detected on the running machine",
  "internal-ip": "detected on the running machine",
  "no-nat-loopback": "detected on the running machine",
  "double-nat": "detected on the running machine",
  "alert-to-open-ports": "detected on the running machine",
  "avahi-should-be-disabled": "describes the running machine",
  "server-name": "read from the host hostname on every boot",
  "password-is-secure": "describes the host OS user password",
  "is-dappnode-aws": "detected once on the running machine",
  "imported-installation-staticIp": "describes the host installation",
  "fullnode-domain-target": "legacy, unused",
  "ethical-metrics-mail": "legacy, migrated into notifications",
  "ethical-metrics-status": "legacy, migrated into notifications"
};

/** dappmanagerdb.json (cache) keys copied into the backup */
export const cacheDbIncludedKeys: Record<string, BackupDbKeyCategory> = {
  // A user setting that happens to live in the cache DB
  "is-nat-renewal-disabled": "settings"
};

/** dappmanagerdb.json (cache) keys left out: ephemeral or machine-specific */
export const cacheDbExcludedKeys: Record<string, string> = {
  "auto-update-registry": "cache",
  "auto-update-pending": "cache",
  "core-update-packages-data": "in-flight core update state",
  "counter-views": "cache",
  "file-transfer-path": "temporary transfers",
  notification: "inbox history",
  "notification-last-emitted-version": "cache",
  "pkg-item-metadata": "cache",
  "package-getting-started-show": "cache",
  "package-install-time": "describes this installation",
  "package-latest-known-version": "cache",
  "package-sent-data": "re-sent by packages",
  "version-data": "describes the running dappmanager",
  "version-data-vpn": "cache",
  "disk-usage-threshold": "alert state",
  "upnp-available": "detected on the running machine",
  "upnp-port-mappings": "detected on the running machine",
  "ports-to-ppen": "detected on the running machine"
};

/** nexusdb.json is copied whole: it only holds user chat history */
export const nexusDbIncludedKeys: Record<string, BackupDbKeyCategory> = {
  "nexus-chat-history": "settings"
};

export function pickKeys(
  data: Record<string, unknown>,
  included: Record<string, BackupDbKeyCategory>
): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const key of Object.keys(included)) {
    if (Object.prototype.hasOwnProperty.call(data, key)) picked[key] = data[key];
  }
  return picked;
}
