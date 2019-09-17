import { dynamicKeyValidate, staticKey, joinWithDot } from "./lowLevelDb";
import { PackageNotification } from "../types";

const NOTIFICATION = "notification";

const notificationKeyGetter = (id: string): string =>
  joinWithDot(NOTIFICATION, id);
const notificationValidate = (
  id: string,
  notification?: PackageNotification
): boolean => {
  return (
    typeof id === "string" &&
    (!notification || typeof notification === "object")
  );
};

export const notification = dynamicKeyValidate<PackageNotification, string>(
  notificationKeyGetter,
  notificationValidate
);

export const notifications = staticKey<{ [id: string]: PackageNotification }>(
  NOTIFICATION,
  {}
);
