import { indexedByKey } from "./dbCache";
import { PackageNotificationDb } from "../types";
import { PackageNotification } from "../types";

const NOTIFICATION = "notification";
const NOTIFICATION_LAST_EMITTED_VERSION = "notification-last-emitted-version";

export const notification = indexedByKey<PackageNotificationDb, string>({
  rootKey: NOTIFICATION,
  getKey: id => id,
  validate: (id, notification) =>
    typeof id === "string" && typeof notification === "object"
});

export function notificationPush(id: string, n: PackageNotification): void {
  notification.set(id, { ...n, timestamp: Date.now(), viewed: false });
}

/**
 * Register the last emitted version for a dnpName
 * Only emit notifications for versions above this one
 */
export const notificationLastEmitVersion = indexedByKey<string, string>({
  rootKey: NOTIFICATION_LAST_EMITTED_VERSION,
  getKey: dnpName => dnpName,
  validate: (dnpName, lastEmittedVersion) =>
    typeof lastEmittedVersion === "string"
});
