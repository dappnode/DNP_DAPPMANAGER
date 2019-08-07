const dockerList = require("modules/dockerList");
const semver = require("semver");
const parse = require("utils/parse");
const apm = require("modules/apm");
const logs = require("logs.js")(module);
const { eventBus, eventBusTag } = require("eventBus");
// Utils
const computeSemverUpdateType = require("utils/computeSemverUpdateType");
const {
  isDnpUpdateEnabled,
  isUpdateDelayCompleted,
  flagSuccessfulUpdate
} = require("utils/autoUpdateHelper");
// External calls
const installPackage = require("calls/installPackage");

/**
 * Only `minor` and `patch` updates are allowed
 */

async function updateMyPackage(name, version) {
  // Check if this specific dnp has auto-updates enabled
  if (!(await isDnpUpdateEnabled(name))) return;

  const latestVersion = await apm.getLatestSemver(parse.packageReq(name));

  // Compute if the update type is "patch"/"minor" = is allowed
  // If release is not allowed, abort
  const updateType = computeSemverUpdateType(version, latestVersion);
  if (updateType !== "minor" && updateType !== "patch") return;

  // Enforce a 24h delay before performing an auto-update
  // Also records the remaining time in the db for the UI
  if (!(await isUpdateDelayCompleted(name, latestVersion))) return;

  logs.info(`Auto-updating ${name} to ${latestVersion}...`);
  await installPackage({ id: name });

  logs.info(`Successfully auto-updated ${name} to ${latestVersion}`);
  await flagSuccessfulUpdate(name, latestVersion);
  eventBus.emit(eventBusTag.emitPackages);
}

async function updateMyPackages() {
  const dnpList = await dockerList.listContainers();

  const dnps = dnpList.filter(
    dnp =>
      dnp.name &&
      // Ignore core DNPs
      dnp.isDnp &&
      // Ignore wierd versions
      semver.valid(dnp.version) &&
      // MUST come from the APM
      !dnp.origin
  );

  for (const { name, version } of dnps) {
    try {
      await updateMyPackage(name, version);
    } catch (e) {
      logs.error(`Error auto-updating ${name}: ${e.stack}`);
    }
  }
}

module.exports = updateMyPackages;
