const semver = require("semver");
const logs = require("logs.js")(module);
const dockerList = require("modules/dockerList");
const apm = require("modules/apm");
// External calls
const installPackage = require("calls/installPackage");
// Utils
const {
  isDnpUpdateEnabled,
  isDnpUpdateAllowed,
  isCoreUpdateEnabled,
  isCoreUpdateAllowed
} = require("utils/autoUpdateHelper");
const parse = require("utils/parse");

const coreDnpName = "core.dnp.dappnode.eth";

const monitoringInterval = 5 * 60 * 1000; // (ms) (5 minutes)

// Wrappers / utils
const getLatestVersion = id => apm.getLatestSemver(parse.packageReq(id));
const update = (id, version, options) =>
  installPackage({ id: [id, version].join("."), options });

/**
 * Auto-update:
 * All code is sequential, to not perform more than one update at once.
 * One of the update might be the core and crash the other updates.
 */
async function autoUpdates() {
  try {
    const dnpUpdateEnabled = await isDnpUpdateEnabled();
    const coreUpdateEnabled = await isCoreUpdateEnabled();

    // Abort early if there are no updates to perform
    if (!dnpUpdateEnabled && !coreUpdateEnabled) return;

    const dnpList = await dockerList.listContainers();

    if (dnpUpdateEnabled) {
      const dnps = dnpList.filter(
        dnp => dnp.isDnp && semver.valid(dnp.version)
      );
      for (const { name, version } of dnps) {
        try {
          const latestVersion = await getLatestVersion(name);

          if (await isDnpUpdateAllowed(version, latestVersion)) {
            logs.info(`Auto-updating ${name} to ${latestVersion}...`);
            await update(name, latestVersion);
            logs.info(`Successfully auto-updated ${name} to ${latestVersion}`);
          }
        } catch (e) {
          logs.error(`Error auto-updating ${name}: ${e.stack}`);
        }
      }
    }

    if (coreUpdateEnabled) {
      try {
        const coreDnp = dnpList.find(dnp => dnp.name === coreDnpName);
        if (!coreDnp) throw Error(`Core DNP not found`);
        const version = coreDnp.version;
        if (!semver.valid(version))
          throw Error(`Invalid core version ${version}`);

        const latestVersion = await getLatestVersion(coreDnpName);

        if (await isCoreUpdateAllowed(version, latestVersion)) {
          logs.info(`Auto-updating system to ${latestVersion}...`);
          await update(coreDnpName, latestVersion, { BYPASS_RESOLVER: true });
          logs.info(`Successfully auto-updated system to ${latestVersion}`);
        }
      } catch (e) {
        logs.error(`Error auto-updating system: ${e.stack}`);
      }
    }
  } catch (e) {
    logs.error(`Error on autoUpdates interval: ${e.stack}`);
  }

  // Trigger the interval loop with setTimeouts to prevent double execution
  setTimeout(autoUpdates, monitoringInterval);
}

autoUpdates();

module.exports = autoUpdates;
