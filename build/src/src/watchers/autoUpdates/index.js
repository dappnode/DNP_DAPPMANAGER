const semver = require("semver");
const logs = require("logs.js")(module);
const dockerList = require("modules/dockerList");
const apm = require("modules/apm");
// External calls
const installPackage = require("calls/installPackage");
// Utils
const { isUpdateAllowed } = require("utils/autoUpdateHelper");
const parse = require("utils/parse");

const coreDnpName = "core.dnp.dappnode.eth";

const monitoringInterval = 5 * 60 * 1000; // (ms) (5 minutes)

/**
 * Auto-update approach:
 * - (1) The watcher should JUST check if the relevant packages
 *   have a more recent version. Then trigger a version check
 *   and if activated, auto-update
 * - ### TODO (2) There have to be a method that checks if a version is ready.
 *   That means resolving the dependencies and making sure all the
 *   necessary content is available. This method has to be called by
 *   - Fetch directory RPC (Directory show)
 *   - Fetch package info RPC (single DNP search in the UI)
 *   - When the watcher finds a new version
 * - (3) The auto-update method when (1) finds a new version and (2)
 *   can verify that it is fully available.
 */

async function autoUpdates() {
  try {
    const dnpList = await dockerList.listContainers();
    const dnps = dnpList
      .filter(dnp => (!dnp.isCore && !dnp.origin) || dnp.name === coreDnpName)
      .filter(dnp => semver.valid(dnp.version));

    for (const { name, version } of dnps) {
      try {
        const latestVersion = await apm.getLatestSemver(parse.packageReq(name));

        if (await isUpdateAllowed(name, version, latestVersion)) {
          // Do not perform more than one update at once
          // One of the update might be the core and crash the other updates
          try {
            logs.info(`Auto-updating ${name} to ${latestVersion}`);
            await installPackage({ id: [name, latestVersion].join(".") });
            logs.info(`Successful auto-update ${name} to ${latestVersion}`);
          } catch (e) {
            logs.error(`Error auto-updating ${name}: ${e.stack}`);
          }
        }
      } catch (e) {
        logs.error(`Error checking updates for ${name}: ${e.stack}`);
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
