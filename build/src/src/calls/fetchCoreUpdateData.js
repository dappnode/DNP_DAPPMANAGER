const semver = require("semver");
const dappGet = require("modules/dappGet");
const getManifest = require("modules/getManifest");
const dockerList = require("modules/dockerList");
const computeSemverUpdateType = require("utils/computeSemverUpdateType");
const { getCoreVersionId } = require("utils/coreVersionId");

const coreName = "core.dnp.dappnode.eth";

/**
 * @returns {object} result = {
 *   available: true {bool},
 *   type: "minor",
 *   packages: [
 *     {
 *       name: "core.dnp.dappnode.eth",
 *       from: "0.2.5",
 *       to: "0.2.6",
 *       manifest: {}
 *     },
 *     {
 *       name: "admin.dnp.dappnode.eth",
 *       from: "0.2.2",
 *       to: "0.2.3",
 *       manifest: {}
 *     }
 *   ],
 *   changelog: "ajshdkas",
 *   updateAlerts: "asjdhkas",
 * }
 */
async function fetchCoreUpdateData({ version = "*" } = {}) {
  /**
   * Resolve core.dnp.dappnode.eth to figure out if it should be installed
   * With the list of deps to install, compute the higher updateType
   * - Check that all core DNPs to be updated have exactly an updateType of "patch"
   */
  const { state: coreDnpsToBeInstalled } = await dappGet(
    { name: coreName, ver: version },
    {
      BYPASS_RESOLVER: true
    }
  );

  const dnpList = await dockerList.listContainers();

  const packages = await Promise.all(
    Object.entries(coreDnpsToBeInstalled).map(async ([depName, depVersion]) => {
      const dnp = dnpList.find(_dnp => _dnp.name === depName);
      const depManifest = await getManifest({
        name: depName,
        ver: depVersion
      });
      return {
        name: depName,
        from: dnp ? dnp.version : "",
        to: depVersion,
        warningOnInstall: depManifest.warningOnInstall,
        manifest: depManifest
      };
    })
  );

  /**
   * If there's no from version, it should be the max jump from "0.0.0",
   * from = "", to = "0.2.7": updateType = "minor"
   */
  const updateTypes = packages.map(({ from, to }) =>
    computeSemverUpdateType(from || "0.0.0", to)
  );

  const type = updateTypes.includes("major")
    ? "major"
    : updateTypes.includes("minor")
    ? "minor"
    : updateTypes.includes("patch")
    ? "patch"
    : null;

  const coreManifest = await getManifest({
    name: coreName,
    ver: version
  });

  /**
   * Compute updateAlerts
   */
  const dnpCore = dnpList.find(dnp => dnp.name === coreName);
  const from = (dnpCore || {}).version;
  const to = coreManifest.version;
  const updateAlerts = (coreManifest.updateAlerts || []).filter(
    updateAlert =>
      semver.valid(from) &&
      semver.valid(to) &&
      updateAlert.message &&
      updateAlert.from &&
      semver.satisfies(from, updateAlert.from) &&
      semver.satisfies(to, updateAlert.to || "*")
  );

  // versionId = "admin@0.2.4,vpn@0.2.2,core@0.2.6"
  const versionId = getCoreVersionId(
    packages.map(({ name, to }) => ({ name, version: to }))
  );

  return {
    available: Object.keys(coreDnpsToBeInstalled).length,
    type,
    packages,
    changelog: coreManifest.changelog,
    updateAlerts,
    versionId
  };
}

module.exports = fetchCoreUpdateData;
