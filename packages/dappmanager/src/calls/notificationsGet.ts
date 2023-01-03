import * as db from "../db";
import { PackageNotificationDb } from "@dappnode/common";

/**
 * Returns not viewed notifications.
 * Use an array as the keys are not known in advance and the array form
 * is okay for RPC transport, as uniqueness is guaranteed
 *
 * @returns notifications object, by notification id
 * notifications = [{
 *   id: "diskSpaceRanOut-stoppedPackages",
 *   type: "danger",
 *   title: "Disk space ran out, stopped packages",
 *   body: "Available disk space is less than a safe ...",
 * }, ... ]
 */
export async function notificationsGet(): Promise<PackageNotificationDb[]> {
  /**
   * Notifications are stored at `notification.{id}`
   * The key `notification` returns an object { "id1": <notification obj>, ... }
   */
  const notifications = db.notification.getAll();
  return Object.values(notifications);
}
