const db = require("../db");

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

const notificationsGet = async () => {
  /**
   * Notifications are stored at `notification.{id}`
   * The key `notification` returns an object { "id1": <notification obj>, ... }
   */
  const notifications = (await db.get(`notification`)) || {};
  const notificationsArray = Object.values(notifications);

  return {
    message: `Got ${notificationsArray.length} notifications`,
    result: notificationsArray
  };
};

module.exports = notificationsGet;
