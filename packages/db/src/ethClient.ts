import { dbCache, dbMain } from "./dbFactory.js";
import { eventBus } from "@dappnode/eventbus";
import {
  EthClientRemote,
  EthClientFallback,
  EthClientStatus,
  EthClientSyncedNotificationStatus,
  EthClientInstallStatus,
  ExecutionClientMainnet,
  ConsensusClientMainnet,
} from "@dappnode/types";

// User chosen properties
const ETH_CLIENT_FALLBACK = "eth-client-fallback";
const ETH_CLIENT_REMOTE = "eth-client-remote";
const ETH_REMOTE_RPC = "eth-remote-rpc";
// Cached status
const ETH_EXEC_CLIENT_INSTALL_STATUS = "eth-exec-client-install-status";
const ETH_CONS_CLIENT_INSTALL_STATUS = "eth-cons-client-install-status";
const ETH_EXEC_CLIENT_STATUS = "eth-exec-client-status";
const ETH_CONS_CLIENT_STATUS = "eth-cons-client-status";
const ETH_PROVIDER_URL = "eth-provider-url";
// Cached temp status
const ETH_CLIENT_SYNCED_NOTIFICATION_STATUS =
  "eth-client-synced-notification-status";

export const ethRemoteRpc = dbMain.staticKey<string>(
  ETH_REMOTE_RPC,
  params.ETH_MAINNET_RPC_URL_REMOTE
);

/**
 * New introduced in dappmanager v0.2.54
 */
export const ethClientRemote = interceptOnSet(
  dbMain.staticKey<EthClientRemote | null>(ETH_CLIENT_REMOTE, null)
);

export const ethClientFallback = interceptOnSet(
  dbMain.staticKey<EthClientFallback>(ETH_CLIENT_FALLBACK, "off")
);

// Cached status, not critical

/**
 * Cache the status of the eth exec client install loop
 */
export const ethExecClientInstallStatus = interceptOnSet(
  dbCache.indexedByKey<EthClientInstallStatus, ExecutionClientMainnet>({
    rootKey: ETH_EXEC_CLIENT_INSTALL_STATUS,
    getKey: (target) => target,
    validate: (id, installStatus) =>
      typeof id === "string" && typeof installStatus === "object",
  })
);

/**
 * Cache the status of the eth cons client install loop
 */
export const ethConsClientInstallStatus = interceptOnSet(
  dbCache.indexedByKey<EthClientInstallStatus, ConsensusClientMainnet>({
    rootKey: ETH_CONS_CLIENT_INSTALL_STATUS,
    getKey: (target) => target,
    validate: (id, installStatus) =>
      typeof id === "string" && typeof installStatus === "object",
  })
);

/**
 * Cache the general status of the eth client, if it's available or not
 */
export const ethExecClientStatus = interceptOnSet(
  dbCache.indexedByKey<EthClientStatus, ExecutionClientMainnet>({
    rootKey: ETH_EXEC_CLIENT_STATUS,
    getKey: (target) => target,
    validate: (id, status) =>
      typeof id === "string" && typeof status === "object",
  })
);

/**
 * Cache the general status of the eth client, if it's available or not
 */
export const ethConsClientStatus = interceptOnSet(
  dbCache.indexedByKey<EthClientStatus, ConsensusClientMainnet>({
    rootKey: ETH_CONS_CLIENT_STATUS,
    getKey: (target) => target,
    validate: (id, status) =>
      typeof id === "string" && typeof status === "object",
  })
);

export const ethProviderUrl = interceptOnSet(
  dbCache.staticKey<string>(ETH_PROVIDER_URL, "")
);

/**
 * Intercept all on set methods to request an update to the UI
 * @param dbSetter
 */
function interceptOnSet<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  F extends (...args: any[]) => any,
  T extends { set: F }
>(dbSetter: T): T {
  return {
    ...dbSetter,
    // Arguments are not used, so their type is not relevant
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    set: function (...args: any[]): void {
      dbSetter.set(...args);
      eventBus.requestSystemInfo.emit();
    },
  };
}

/**
 * Cache the status of the eth client install loop
 */
export const ethClientSyncedNotificationStatus =
  dbCache.staticKey<EthClientSyncedNotificationStatus>(
    ETH_CLIENT_SYNCED_NOTIFICATION_STATUS,
    null
  );
