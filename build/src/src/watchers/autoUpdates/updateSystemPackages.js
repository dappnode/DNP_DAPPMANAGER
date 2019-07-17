const dockerList = require("modules/dockerList");
const semver = require("semver");
const parse = require("utils/parse");
const apm = require("modules/apm");
const logs = require("logs.js")(module);
const dappGet = require("modules/dappGet");
const computeSemverUpdateType = require("utils/computeSemverUpdateType");
// External calls
const installPackage = require("calls/installPackage");

const coreDnpName = "core.dnp.dappnode.eth";

/**
 * Only `patch` updates are allowed
 */

async function isCoreUpdateAllowed() {
  const dnpList = await dockerList.listContainers();
  const coreDnp = dnpList.find(dnp => dnp.name === coreDnpName);
  if (coreDnp && semver.valid(coreDnp.version)) {
    /**
     * If core.dnp.dappnode.eth, use it to figure out the version
     */
    const latestVersion = await apm.getLatestSemver(
      parse.packageReq(coreDnpName)
    );
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
    await installPackage({
      id: coreDnpName,
      options: { BYPASS_RESOLVER: true }
    });
    logs.info(`Successfully auto-updated system packages`);
  }
}

module.exports = updateSystemPackages;
