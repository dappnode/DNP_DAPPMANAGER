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
  updateRegistry,
  removeRegistryEntry
} = require("utils/autoUpdateHelper");
// External calls
const installPackage = require("calls/installPackage");

const coreDnpName = "core.dnp.dappnode.eth";

/**
 * Only `patch` updates are allowed
 */

let latestVersionCache;

async function isCoreUpdateAllowed() {
  const dnpList = await dockerList.listContainers();

  /**
   * Cache the last version to avoid running additional tasks
   */
  const latestVersion = await apm.getLatestSemver(
    parse.packageReq(coreDnpName)
  );
  if (!latestVersion || latestVersionCache === latestVersion) return false;
  latestVersionCache = latestVersion;

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
  if (await isCoreUpdateAllowed()) {
    logs.info(`Auto-updating system packages...`);

    /**
     * If the DAPPMANAGER is updated the updateRegistry will never be executed.
     * Add it preventively, and then remove it if the update errors
     */
    const registryEntry = {
      name: coreDnpName,
      version: latestVersionCache,
      timestamp: Date.now()
    };
    await updateRegistry(registryEntry);

    try {
      await installPackage({
        id: coreDnpName,
        options: { BYPASS_RESOLVER: true }
      });
      logs.info(`Successfully auto-updated system packages`);
      // Update the UI dynamically of the new successful auto-update
      eventBus.emit(eventBusTag.emitUpdateRegistry);
    } catch (e) {
      // Remove the log and throw
      await removeRegistryEntry(registryEntry);
      throw e;
    }
  }
}

module.exports = updateSystemPackages;
