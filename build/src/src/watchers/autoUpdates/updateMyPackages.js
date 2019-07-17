const dockerList = require("modules/dockerList");
const semver = require("semver");
const parse = require("utils/parse");
const apm = require("modules/apm");
const logs = require("logs.js")(module);
// External calls
const installPackage = require("calls/installPackage");
// Utils
const computeSemverUpdateType = require("utils/computeSemverUpdateType");
const { isDnpUpdateEnabled } = require("utils/autoUpdateHelper");

/**
 * Only `minor` and `patch` updates are allowed
 */

async function updateMyPackages() {
  const dnpList = await dockerList.listContainers();

  const dnps = dnpList.filter(dnp => dnp.isDnp && semver.valid(dnp.version));

  for (const { name, version } of dnps) {
    try {
      /**
       * Check if this specific dnp has auto-updates enabled
       */
      if (!(await isDnpUpdateEnabled(name))) continue;

      const latestVersion = await apm.getLatestSemver(parse.packageReq(name));

      // If release is not allowed, abort
      const updateType = computeSemverUpdateType(version, latestVersion);
      if (updateType !== "minor" && updateType !== "patch") return;

      logs.info(`Auto-updating ${name} to ${latestVersion}...`);
      await installPackage({ id: [name, version].join(".") });
      logs.info(`Successfully auto-updated ${name} to ${latestVersion}`);
    } catch (e) {
      logs.error(`Error auto-updating ${name}: ${e.stack}`);
    }
  }
}

module.exports = updateMyPackages;
