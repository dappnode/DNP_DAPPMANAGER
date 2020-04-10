import { dynamicKeyValidate, staticKey } from "./dbCache";
import { PackageNotification } from "../types";
import { joinWithDot } from "./dbUtils";

const NOTIFICATION = "notification";

const notificationKeyGetter = (id: string): string =>
  joinWithDot(NOTIFICATION, id);
const notificationValidate = (
  id: string,
  notification?: PackageNotification
): boolean => typeof id === "string" && typeof notification === "object";

export const notification = dynamicKeyValidate<PackageNotification, string>(
  notificationKeyGetter,
  notificationValidate
);

export const notifications = staticKey<{ [id: string]: PackageNotification }>(
  NOTIFICATION,
  {}
);
