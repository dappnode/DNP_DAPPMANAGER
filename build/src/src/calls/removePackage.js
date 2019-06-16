const fs = require("fs");
const db = require("db");
const params = require("params");
const { eventBus, eventBusTag } = require("eventBus");
const logs = require("logs.js")(module);
// Modules
const docker = require("modules/docker");
// Utils
const parseManifestPorts = require("utils/parseManifestPorts");
const getPath = require("utils/getPath");
const shell = require("utils/shell");

/**
 * Remove package data: docker down + disk files
 *
 * @param {string} id DNP .eth name
 * @param {bool} deleteVolumes flag to also clear permanent package data
 */
const removePackage = async ({ id, deleteVolumes = false }) => {
  if (!id) throw Error("kwarg id must be defined");

  if (id.includes("dappmanager.dnp.dappnode.eth")) {
    throw Error("The installer cannot be removed");
  }

  // CLOSE PORTS
  // portsToClose: [ {number: 30303, type: 'UDP'}, ...]
  const dnp = await docker.getDnpData(id);

  // Get manifest
  let mappedPortsToClose = [];
  try {
    const manifestPath = getPath.manifest(id, params, dnp.isCore);
    const manifestFileData = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(manifestFileData);
    mappedPortsToClose = parseManifestPorts(manifest);
  } catch (e) {
    logs.error(
      `Error getting mappedPortsToClose from manifest of ${dnp.name}: ${
        e.stack
      }`
    );
  }
  // Skip if there are no ports to open or if UPnP is not available
  const upnpAvailable = await db.get("upnpAvailable");
  // dnp.portsToClose = [ {number: 30303, type: 'UDP'}, ...] - will always be defined and an array
  const portsToClose = [...mappedPortsToClose, ...dnp.portsToClose];
  if (dnp.portsToClose.length && upnpAvailable) {
    eventBus.emit(eventBusTag.call, {
      callId: "managePorts",
      kwargs: {
        action: "close",
        ports: portsToClose
      }
    });
  }

  // Remove container (and volumes)
  if (deleteVolumes)
    await docker.removeDnpVolumes(id, {
      restartDnpsAfter: false
    });
  else await docker.composeRm(id);

  // Remove DNP folder and files
  await shell(`rm -r ${getPath.packageRepoDir(id, params)}`);

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);
  eventBus.emit(eventBusTag.packageModified);

  return {
    message: `Removed package: ${id}`,
    logMessage: true,
    userAction: true
  };
};

module.exports = removePackage;
