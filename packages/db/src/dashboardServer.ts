import { dbCache } from "./dbFactory.js";
import { Network } from "@dappnode/types";

const DASHBOARD_SERVER_LAST_POST_TIMESTAMP = "dashboard-server-last-post-timestamp";
const DASHBOARD_SERVER_LAST_SNAPSHOT = "dashboard-server-last-snapshot";

/**
 * Snapshot of validator indices stored in DB
 */
interface StoredValidatorSnapshot {
  indices: number[];
  timestamp: number;
}

/**
 * Last POST timestamp per network.
 * Used to enforce the 24-hour interval trigger.
 */
export const dashboardServerLastPostTimestamp = dbCache.indexedByKey<
  number,
  Network
>({
  rootKey: DASHBOARD_SERVER_LAST_POST_TIMESTAMP,
  getKey: (network) => network
});

/**
 * Last successful snapshot per network.
 * Used for change detection.
 */
export const dashboardServerLastSnapshot = dbCache.indexedByKey<
  StoredValidatorSnapshot,
  Network
>({
  rootKey: DASHBOARD_SERVER_LAST_SNAPSHOT,
  getKey: (network) => network
});
