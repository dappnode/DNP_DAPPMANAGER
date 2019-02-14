const db = require('../db');

/**
 * Marks notifications as view by deleting them from the db
 *
 * @param {Object} kwargs: {
 *   ids: [
 *     'diskSpaceRanOut-stoppedPackages',
 *     'diskSpaceRanOut-stoppedPackages2'
 *   ]
 * }
 * @return {Object} A formated success message.
 */

const notificationsGet = async ({ids = []}) => {
  if (!ids) throw Error('kwarg ids must be defined');

  for (const id of ids) {
    await db.remove(`notification.${id}`);
  }

  return {
    message: `Removed notifications: ${ids.join(', ')}`,
  };
};

module.exports = notificationsGet;
