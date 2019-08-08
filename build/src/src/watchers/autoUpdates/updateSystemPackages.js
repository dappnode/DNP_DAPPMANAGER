const dockerList = require("modules/dockerList");
const parse = require("utils/parse");
const apm = require("modules/apm");
const logs = require("logs.js")(module);
const dappGet = require("modules/dappGet");
const { eventBus, eventBusTag } = require("eventBus");
// Utils
const computeSemverUpdateType = require("utils/computeSemverUpdateType");
const {
  flagSuccessfulUpdate,
  unflagSuccessfulUpdate,
  isUpdateDelayCompleted
} = require("utils/autoUpdateHelper");
// External calls
const installPackage = require("calls/installPackage");

const coreDnpName = "core.dnp.dappnode.eth";

/**
 * Only `patch` updates are allowed
 */

async function isCoreUpdateAllowed() {
  const dnpList = await dockerList.listContainers();

  /**
   * Resolve core.dnp.dappnode.eth to figure out if it should be installed
   * With the list of deps to install, compute the higher updateType
   * - Check that all core DNPs to be updated have exactly an updateType of "patch"
   */
  const { state } = await dappGet(parse.packageReq(coreDnpName), {
    BYPASS_RESOLVER: true
  });

  // If there is no DNP to be updated, don't allow the update
  if (!Object.keys(state).length) return false;

  // State includes `coreDnpName` and any other core DNP to be updated
  for (const [name, newVersion] of Object.entries(state)) {
    const dnp = dnpList.find(dnp => dnp.name === name) || {};
    // If a required DNP is not installed or the update type is not patch, don't allow
    const updateType = computeSemverUpdateType(dnp.version, newVersion);
    if (updateType !== "patch") return false;
  }

  // If all checks are okay, allow the update
  return true;
}

async function updateSystemPackages() {
  const latestVersion = await apm.getLatestSemver({ name: coreDnpName });

  // Compute if the update type is "patch" = is allowed
  if (!(await isCoreUpdateAllowed(latestVersion))) return;

  // Enforce a 24h delay before performing an auto-update
  // Also records the remaining time in the db for the UI
  if (!(await isUpdateDelayCompleted(coreDnpName, latestVersion))) return;

  logs.info(`Auto-updating system packages...`);

  /**
   * If the DAPPMANAGER is updated the updateRegistry will never be executed.
   * Add it preventively, and then remove it if the update errors
   */
  await flagSuccessfulUpdate(coreDnpName, latestVersion);

  try {
    await installPackage({
      id: coreDnpName,
      options: { BYPASS_RESOLVER: true }
    });

    logs.info(`Successfully auto-updated system packages`);
    eventBus.emit(eventBusTag.emitPackages);
  } catch (e) {
    // Remove the log and throw
    await unflagSuccessfulUpdate(coreDnpName, latestVersion);
    throw e;
  }
}

module.exports = updateSystemPackages;
