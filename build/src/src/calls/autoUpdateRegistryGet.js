const autoUpdateHelper = require("utils/autoUpdateHelper");

/**
 * Returns a registry of successfully completed auto-updates
 *
 * @returns {object} autoUpdateRegistry = {
 *   "system-packages": [
 *     { version: "0.2.4", timestamp: 1563304834738 }
 *     { version: "0.2.5", timestamp: 1563371560487 }
 *   ]
 *   "bitcoin.dnp.dappnode.eth": [
 *     { version: "0.1.1", timestamp: 1563304834738 }
 *     { version: "0.1.2", timestamp: 1563371560487 }
 *   ]
 * }
 */
const autoUpdateRegistryGet = async () => {
  return {
    message: `Got auto updated registry`,
    result: await autoUpdateHelper.getRegistry()
  };
};

module.exports = autoUpdateRegistryGet;
