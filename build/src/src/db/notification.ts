import { dynamicKeyValidate, staticKey } from "./dbCache";
import { PackageNotificationDb } from "../types";
import { joinWithDot } from "./dbUtils";
import { PackageNotification } from "../common/types";

const NOTIFICATION = "notification";

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
export function notificationPush(id: string, n: PackageNotification) {
  notification.set(id, { ...n, timestamp: Date.now(), viewed: false });
}

export const notifications = staticKey<{ [id: string]: PackageNotificationDb }>(
  NOTIFICATION,
  {}
);
