const db = require("../db");

/**
 * Returns not viewed notifications
 *
 * @returns {object} notifications object, by notification id
 * notifications = {
 *   "diskSpaceRanOut-stoppedPackages": {
 *     id: "diskSpaceRanOut-stoppedPackages",
 *     type: "danger",
 *     title: "Disk space ran out, stopped packages",
 *     body: "Available disk space is less than a safe ...",
 *   }
 * }
 */

const notificationsGet = async () => {
  const notifications = (await db.get(`notification`)) || {};

  return {
    message: `Got ${Object.keys(notifications).length} notifications`,
    result: notifications
  };
};

module.exports = notificationsGet;
