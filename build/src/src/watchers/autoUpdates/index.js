const logs = require("logs.js")(module);
const params = require("params");
const { eventBus, eventBusTag } = require("eventBus");
// Utils
const {
  isDnpUpdateEnabled,
  isCoreUpdateEnabled,
  clearPendingUpdates
} = require("utils/autoUpdateHelper");

const updateMyPackages = require("./updateMyPackages");
const updateSystemPackages = require("./updateSystemPackages");

const monitoringInterval = params.AUTO_UPDATE_WATCHER_INTERVAL || 5 * 60 * 1000; // (ms) (5 minutes)

/**
 * Auto-update:
 * All code is sequential, to not perform more than one update at once.
 * One of the update might be the core and crash the other updates.
 */
async function autoUpdates() {
  try {
    if (await isDnpUpdateEnabled()) {
      try {
        await updateMyPackages();
      } catch (e) {
        logs.error(`Error on updateMyPackages: ${e.stack}`);
      }
    }

    if (await isCoreUpdateEnabled()) {
      try {
        await updateSystemPackages();
      } catch (e) {
        logs.error(`Error on updateSystemPackages: ${e.stack}`);
      }
    }
  } catch (e) {
    logs.error(`Error on autoUpdates interval: ${e.stack}`);
  }

  // Trigger the interval loop with setTimeouts to prevent double execution
  setTimeout(autoUpdates, monitoringInterval);
}

autoUpdates();

eventBus.onSafe(eventBusTag.packageModified, ({ id, removed } = {}) => {
  if (removed)
    clearPendingUpdates(id).catch(e =>
      logs.error(`Error clearPendingUpdates: ${e.stack}`)
    );
});

module.exports = autoUpdates;
