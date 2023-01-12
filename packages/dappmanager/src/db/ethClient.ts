import { dbCache, dbMain } from "./dbFactory";
import { EthClientSyncedNotificationStatus } from "../types";
import { EthClientInstallStatus } from "../modules/ethClient/types";
import { eventBus } from "../eventBus";
import {
  EthClientTarget,
  EthClientRemote,
  EthClientFallback,
  ExecutionClientMainnet,
  ConsensusClientMainnet,
  EthClientStatus
} from "@dappnode/common";

// User chosen properties
const ETH_CLIENT_TARGET = "eth-client-target";
const ETH_CLIENT_FALLBACK = "eth-client-fallback";
const ETH_CLIENT_REMOTE = "eth-client-remote";
// Cached status
const ETH_EXEC_CLIENT_INSTALL_STATUS = "eth-exec-client-install-status";
const ETH_CONS_CLIENT_INSTALL_STATUS = "eth-cons-client-install-status";
const ETH_CLIENT_STATUS = "eth-client-status";
const ETH_EXEC_CLIENT_STATUS = "eth-exec-client-status";
const ETH_CONS_CLIENT_STATUS = "eth-cons-client-status";
const ETH_PROVIDER_URL = "eth-provider-url";
// Cached temp status
const ETH_CLIENT_SYNCED_NOTIFICATION_STATUS =
  "eth-client-synced-notification-status";

// Re-export to consider the first value (when it's not set)
// but do not allow to set null again. Using to express intentionality
const _ethClientTarget = interceptOnSet(
  dbMain.staticKey<EthClientTarget | null>(ETH_CLIENT_TARGET, null)
);

/**
 * To be DEPRECATED from dappmanager v0.2.54
 * The ethclientTarget will be splitted into:
 * - consensusClientMainnet, executionClientMainnet and ethClientRemote
 * - users can use the stakers UI in mainnet while using the "remote" option
 * - whenever a user switches the EC and/or CC then consensusClientMainnet, executionClientMainnet will change as well
 */
export const ethClientTarget = {
  get: _ethClientTarget.get,
  set: (newValue: EthClientTarget): void => _ethClientTarget.set(newValue)
};

/**
 * New introduced in dappmanager v0.2.54
 * - tracks if the user is using remote option
 * - remote is compatible while stakingig in mainnet with EC and CC defined by the user
 * - default value set at initializeDb. Deppends on the old ethClientTarget
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
    getKey: target => target,
    validate: (id, installStatus) =>
      typeof id === "string" && typeof installStatus === "object"
  })
);

/**
 * Cache the status of the eth cons client install loop
 */
export const ethConsClientInstallStatus = interceptOnSet(
  dbCache.indexedByKey<EthClientInstallStatus, ConsensusClientMainnet>({
    rootKey: ETH_CONS_CLIENT_INSTALL_STATUS,
    getKey: target => target,
    validate: (id, installStatus) =>
      typeof id === "string" && typeof installStatus === "object"
  })
);

/**
 * Cache the general status of the eth client, if it's available or not
 */
export const ethExecClientStatus = interceptOnSet(
  dbCache.indexedByKey<EthClientStatus, ExecutionClientMainnet>({
    rootKey: ETH_EXEC_CLIENT_STATUS,
    getKey: target => target,
    validate: (id, status) =>
      typeof id === "string" && typeof status === "object"
  })
);

/**
 * Cache the general status of the eth client, if it's available or not
 */
export const ethConsClientStatus = interceptOnSet(
  dbCache.indexedByKey<EthClientStatus, ConsensusClientMainnet>({
    rootKey: ETH_CONS_CLIENT_STATUS,
    getKey: target => target,
    validate: (id, status) =>
      typeof id === "string" && typeof status === "object"
  })
);

/**
 * Cache the general status of the eth client, if it's available or not
 */
export const ethClientStatus = interceptOnSet(
  dbCache.indexedByKey<EthClientStatus, EthClientTarget>({
    rootKey: ETH_CLIENT_STATUS,
    getKey: target => target,
    validate: (id, status) =>
      typeof id === "string" && typeof status === "object"
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
    }
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
