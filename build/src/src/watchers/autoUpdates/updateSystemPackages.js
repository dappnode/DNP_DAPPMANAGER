const dockerList = require("modules/dockerList");
const semver = require("semver");
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

async function isCoreUpdateAllowed(latestVersion) {
  const dnpList = await dockerList.listContainers();

  const coreDnp = dnpList.find(dnp => dnp.name === coreDnpName);
  if (coreDnp && semver.valid(coreDnp.version)) {
    /**
     * If core.dnp.dappnode.eth, use it to figure out the version
     */
    const updateType = computeSemverUpdateType(coreDnp.version, latestVersion);
    return updateType === "patch";
  } else {
    /**
     * Otherwise, resolve core.dnp.dappnode.eth to figure out if it should be installed
     * With the list of deps to install, compute the higher updateType
     * - Check that all core DNPs to be updated have exactly an updateType of "patch"
     */
    const { state } = await dappGet(parse.packageReq(coreDnpName), {
      BYPASS_RESOLVER: true
    });

    const deps = Object.assign({}, state);
    delete deps[coreDnpName];

    const coreDnps = dnpList.filter(
      dnp => dnp.isCore && semver.valid(dnp.version) && deps[dnp.name]
    );

    for (const { name, version } of coreDnps) {
      const updateType = computeSemverUpdateType(version, deps[name]);
      if (updateType !== "patch") return false;
    }
    return true;
  }
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
