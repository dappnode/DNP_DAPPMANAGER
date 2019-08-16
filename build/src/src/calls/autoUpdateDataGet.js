const autoUpdateHelper = require("utils/autoUpdateHelper");

/**
 * Returns a registry of successfully completed auto-updates
 *
 * @returns {object} result = {
 *   settings: {
 *     "system-packages": { enabled: true }
 *     "my-packages": { enabled: true }
 *     "bitcoin.dnp.dappnode.eth": { enabled: false }
 *   },
 *   registry: {
 *     "core.dnp.dappnode.eth": {
 *       "0.2.4": { updated: 1563304834738, successful: true },
 *       "0.2.5": { updated: 1563304834738, successful: false }
 *     },
 *     "bitcoin.dnp.dappnode.eth": {
 *       "0.1.1": { updated: 1563304834738, successful: true },
 *       "0.1.2": { updated: 1563304834738, successful: true }
 *     }
 *   },
 *   pending: {
 *     "core.dnp.dappnode.eth": {
 *       version: "0.2.4",
 *       firstSeen: 1563218436285,
 *       scheduledUpdate: 1563304834738,
 *       completedDelay: true
 *     },
 *     "bitcoin.dnp.dappnode.eth": {
 *       version: "0.1.2",
 *       firstSeen: 1563218436285,
 *       scheduledUpdate: 1563304834738,
 *       completedDelay: false,
 *     }
 *   }
 * }
 */
async function autoUpdateDataGet() {
  return {
    message: `Got auto update data`,
    result: {
      settings: await autoUpdateHelper.getSettings(),
      registry: await autoUpdateHelper.getRegistry(),
      pending: await autoUpdateHelper.getRegistry()
    }
  };
}

module.exports = autoUpdateDataGet;
