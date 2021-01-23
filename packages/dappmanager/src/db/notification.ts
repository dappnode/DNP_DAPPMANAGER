import { dynamicKeyValidate, staticKey } from "./dbCache";
import { PackageNotificationDb } from "../types";
import { joinWithDot } from "./dbUtils";
import { PackageNotification } from "../types";

const NOTIFICATION = "notification";
const NOTIFICATION_LAST_EMITTED_VERSION = "notification-last-emitted-version";

const notificationKeyGetter = (id: string): string =>
  joinWithDot(NOTIFICATION, id);
const notificationValidate = (
  id: string,
  notification?: PackageNotificationDb
): boolean => typeof id === "string" && typeof notification === "object";

export const notification = dynamicKeyValidate<PackageNotificationDb, string>(
  notificationKeyGetter,
  notificationValidate
);
export function notificationPush(id: string, n: PackageNotification): void {
  notification.set(id, { ...n, timestamp: Date.now(), viewed: false });
}

export const notifications = staticKey<{ [id: string]: PackageNotificationDb }>(
  NOTIFICATION,
  {}
);

/**
 * Register the last emitted version for a dnpName
 * Only emit notifications for versions above this one
 */
export const notificationLastEmitVersion = dynamicKeyValidate<string, string>(
  dnpName => joinWithDot(NOTIFICATION_LAST_EMITTED_VERSION, dnpName),
  (dnpName, lastEmittedVersion) => typeof lastEmittedVersion === "string"
);
