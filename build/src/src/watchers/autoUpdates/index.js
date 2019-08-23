const logs = require("logs.js")(module);
const params = require("params");
const { eventBus, eventBusTag } = require("eventBus");
const fetchCoreUpdateData = require("calls/fetchCoreUpdateData");
// Utils
const {
  isDnpUpdateEnabled,
  isCoreUpdateEnabled,
  clearPendingUpdates,
  clearRegistry,
  clearCompletedCoreUpdatesIfAny
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
  clearRegistry(id).catch(e => logs.error(`Error clearRegistry: ${e.stack}`));
});

/**
 * If the DAPPMANAGER is updated the pending state will never be updated to
 * "completed". So on every DAPPMANAGER start it must checked if a successful
 * update happen before restarting
 */
checkForCompletedCoreUpdates();
async function checkForCompletedCoreUpdates() {
  try {
    const {
      result: { versionId }
    } = await fetchCoreUpdateData();
    await clearCompletedCoreUpdatesIfAny(versionId);
  } catch (e) {
    logs.error(`Error on clearCompletedCoreUpdatesIfAny: ${e.stack}`);
  }
}

module.exports = autoUpdates;
