const fs = require("fs");
const db = require("db");
const params = require("params");
const { eventBus, eventBusTag } = require("eventBus");
const logs = require("logs.js")(module);
// Modules
const docker = require("modules/docker");
const dockerList = require("modules/dockerList");
// Utils
const parseManifestPorts = require("utils/parseManifestPorts");
const getPath = require("utils/getPath");
const shell = require("utils/shell");
const logUI = require("utils/logUI");

/**
 * Remove package data: docker down + disk files
 *
 * @param {Object} kwargs: {
 *   id: package .eth name (string)
 *   deleteVolumes: flag to also clear permanent package data
 *   logId: task id (string)
 * }
 * @return {Object} A formated success message.
 * result: empty
 */
const removePackage = async ({ id, deleteVolumes = false, logId }) => {
  if (!id) throw Error("kwarg id must be defined");

  const packageRepoDir = getPath.packageRepoDir(id, params);

  const dockerComposePath = getPath.dockerComposeSmart(id, params);
  if (!fs.existsSync(dockerComposePath)) {
    throw Error("No docker-compose found: " + dockerComposePath);
  }

  if (id.includes("dappmanager.dnp.dappnode.eth")) {
    throw Error("The installer cannot be restarted");
  }

  // CLOSE PORTS
  // portsToClose: '["32768/udp","32768/tcp"]'
  const dnpList = await dockerList.listContainers();
  const dnp = dnpList.find(_dnp => _dnp.name && _dnp.name.includes(id));
  if (!dnp) {
    throw Error(
      `No DNP was found for name ${id}, so its ports cannot be closed`
    );
  }
  // Get manifest
  let mappedPortsToClose = [];
  try {
    const manifestPath = getPath.manifest(id, params, dnp.isCORE || dnp.isCore);
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

  // Remove container (and) volumes
  logUI({ logId, name: "all", msg: "Shutting down containers..." });
  await docker.compose.down(dockerComposePath, {
    volumes: Boolean(deleteVolumes)
  });
  // Remove DNP folder and files
  logUI({ logId, name: "all", msg: "Removing system files..." });
  await shell("rm -r " + packageRepoDir);

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);
  eventBus.emit(eventBusTag.packageModified);

  return {
    message: "Removed package: " + id,
    logMessage: true,
    userAction: true
  };
};

module.exports = removePackage;
