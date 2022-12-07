/**
 * Convert "0.2.5" to "0-2-5". `MUST` be applied to any key that
 * may contain the dot character "."
 *
 * @deprecated The previous db `"low-db"` required dots to be stripped
 * so lodash didn't understood the key as a JSON path
 */
export function stripDots(string: string): string {
  return string.replace(/\./g, "-");
}

export const dbKeys = {
  // autoUpdateSettings
  AUTO_UPDATE_SETTINGS: "auto-update-settings",
  AUTO_UPDATE_REGISTRY: "auto-update-registry",
  AUTO_UPDATE_PENDING: "auto-update-pending",
  // coreUpdate
  CORE_UPDATE_PACKAGES_DATA: "core-update-packages-data",
  // dyndns
  PUBLIC_IP: "public-ip",
  DOMAIN: "domain",
  DYNDNS_IDENTITY: "dyndns-identity",
  STATIC_IP: "static-ip",
  // ethClient
  ETH_CLIENT_TARGET: "eth-client-target",
  ETH_CLIENT_FALLBACK: "eth-client-fallback",
  ETH_CLIENT_REMOTE: "eth-client-remote",
  ETH_EXEC_CLIENT_INSTALL_STATUS: "eth-exec-client-install-status",
  ETH_CONS_CLIENT_INSTALL_STATUS: "eth-cons-client-install-status",
  ETH_CLIENT_STATUS: "eth-client-status",
  ETH_EXEC_CLIENT_STATUS: "eth-exec-client-status",
  ETH_CONS_CLIENT_STATUS: "eth-cons-client-status",
  ETH_PROVIDER_URL: "eth-provider-url",
  ETH_CLIENT_SYNCED_NOTIFICATION_STATUS:
    "eth-client-synced-notification-status",
  // fileTransferPath
  FILE_TRANSFER_PATH: "file-transfer-path",
  // ipfsClient
  IPFS_CLIENT_TARGET: "ipfs-client-target",
  IPFS_GATEWAY: "ipfs-gateway",
  // network
  NO_NAT_LOOPBACK: "no-nat-loopback",
  DOUBLE_NAT: "double-nat",
  ALERT_TO_OPEN_PORTS: "alert-to-open-ports",
  INTERNAL_IP: "internal-ip",
  AVAHI_SHOULD_BE_DISABLED: "avahi-should-be-disabled",
  // notification
  NOTIFICATION: "notification",
  NOTIFICATION_LAST_EMITTED_VERSION: "notification-last-emitted-version",
  // package
  PACKAGE_GETTING_STARTED_SHOW: "package-getting-started-show",
  PACKAGE_INSTALL_TIME: "package-install-time",
  PACKAGE_LATEST_KNOWN_VERSION: "package-latest-known-version",
  PACKAGE_SENT_DATA: "package-sent-data",
  // registry
  REGISTRY_EVENTS: "registry-events",
  REGISTRY_LAST_FETCHED_BLOCK: "registry-last-fetched-block",
  REGISTRY_LAST_PROVIDER_BLOCK: "registry-last-block",
  // releaseKeys
  RELEASE_KEYS_TRUSTED: "release-keys-trusted",
  // secrets
  NACL_SECRET_KEY: "nacl-secret-key",
  NACL_PUBLIC_KEY: "nacl-public-key",
  IDENTITY_ADDRESS: "identity.address",
  // stakerConfig
  STAKER_ITEM_METADATA: "staker-item-metadata",
  CONSENSUS_CLIENT_MAINNET: "consensus-client-mainnet",
  EXECUTION_CLIENT_MAINNET: "execution-client-mainnet",
  MEVBOOST_MAINNET: "mevboost-mainnet",
  CONSENSUS_CLIENT_GNOSIS: "consensus-client-gnosis",
  EXECUTION_CLIENT_GNOSIS: "execution-client-gnosis",
  MEVBOOST_GNOSIS: "mevboost-gnosis",
  CONSENSUS_CLIENT_PRATER: "consensus-client-prater",
  EXECUTION_CLIENT_PRATER: "execution-client-prater",
  MEVBOOST_PRATER: "mevboost-prater",
  // system
  SERVER_NAME: "server-name",
  FULLNODE_DOMAIN_TARGET: "fullnode-domain-target",
  PASSWORD_IS_SECURE: "password-is-secure",
  VERSION_DATA: "version-data",
  TELEGRAM_STATUS: "telegram-status",
  TELEGRAM_TOKEN: "telegram-token",
  TELEGRAM_CHANNEL_ID: "telegram-channel-id",
  DISK_USAGE_THRESHOLD: "disk-usage-threshold",
  DAPPNODE_WEB_NAME: "dappnode-web-name",
  // systemFlags
  IMPORTED_INSTALLATION_STATIC_IP: "imported-installation-static-ip",
  IS_VPN_DB_MIGRATED: "is-vpn-db-migrated",
  // ui
  NEW_FEATURE_STATUS: "new-feature-status",
  // upnp
  UPNP_AVAILABLE: "upnp-available",
  UPNP_PORT_MAPPINGS: "upnp-port-mappings",
  PORTS_TO_OPEN: "ports-to-open",
  IS_NAT_RENEWAL_DISABLED: "is-nat-renewal-disabled",
  // vpn
  VERSION_DATA_VPN: "version-data-vpn"
} as const;

export type DbKeys = keyof typeof dbKeys;

export type DbValues = typeof dbKeys[DbKeys];
