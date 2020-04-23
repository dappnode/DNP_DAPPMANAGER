import * as db from "../db";
import { PackageNotification } from "../types";

type ReturnData = PackageNotification[];

/**
 * Returns not viewed notifications.
 * Use an array as the keys are not known in advance and the array form
 * is okay for RPC transport, as uniqueness is guaranteed
 *
 * @returns {object} notifications object, by notification id
 * notifications = [{
 *   id: "diskSpaceRanOut-stoppedPackages",
 *   type: "danger",
 *   title: "Disk space ran out, stopped packages",
 *   body: "Available disk space is less than a safe ...",
 * }, ... ]
 */
export default async function notificationsGet(): Promise<ReturnData> {
  /**
   * Notifications are stored at `notification.{id}`
   * The key `notification` returns an object { "id1": <notification obj>, ... }
   */
  const notifications: {
    [notificationid: string]: PackageNotification;
  } = db.notifications.get();
  return Object.values(notifications);
}
