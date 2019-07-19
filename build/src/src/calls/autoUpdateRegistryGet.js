const autoUpdateHelper = require("utils/autoUpdateHelper");

/**
 * Returns a registry of successfully completed auto-updates
 *
 * @returns {object} registry = {
 *   "core.dnp.dappnode.eth": {
 *     "0.2.4": { firstSeen: 1563218436285, updated: 1563304834738, completedDelay: true },
 *     "0.2.5": { firstSeen: 1563371560487 }
 *   },
 *   "bitcoin.dnp.dappnode.eth": {
 *     "0.1.1": { firstSeen: 1563218436285, updated: 1563304834738, completedDelay: true },
 *     "0.1.2": { firstSeen: 1563371560487 }
 *   }
 * }
 */
const autoUpdateRegistryGet = async () => {
  return {
    message: `Got auto updated registry`,
    result: await autoUpdateHelper.getRegistry()
  };
};

module.exports = autoUpdateRegistryGet;
