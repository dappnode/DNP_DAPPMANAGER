const fs = require("fs");
const getPath = require("utils/getPath");
const params = require("params");
const docker = require("modules/docker");
const dockerList = require("modules/dockerList");
const { eventBus, eventBusTag } = require("eventBus");
const { stringIncludes } = require("utils/strings");

/**
 * Removes a package volumes. The re-ups the package
 *
 * @param {string} id DNP .eth name
 */
async function restartPackageVolumes({ id }) {
  if (!id) throw Error("kwarg id must be defined");

  const dnpList = await dockerList.listContainers();
  const dnp = dnpList.find(_dnp => stringIncludes(_dnp.name, id));
  if (!dnp) {
    throw Error(`Could not find an container with the name: ${id}`);
  }
  const dockerComposePath = getPath.dockerComposeSmart(id, params);
  if (!fs.existsSync(dockerComposePath)) {
    throw Error(`No docker-compose found: ${dockerComposePath}`);
  }
  if (id.includes("dappmanager.dnp.dappnode.eth")) {
    throw Error("The installer cannot be restarted");
  }

  // If there are no volumes don't do anything
  if (!dnp.volumes || !dnp.volumes.length) {
    return {
      message: id + " has no volumes "
    };
  }

  if (dnp.isCore) {
    // docker-compose down can't be called because of the shared network
    await docker.compose.rm(dockerComposePath);
    await docker.volume.rm(dnp.volumes.map(v => v.name).join(" "));
  } else {
    await docker.compose.down(dockerComposePath, { volumes: true });
  }
  // Restart docker to apply changes
  await docker.safe.compose.up(dockerComposePath);

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: `Restarted ${id} volumes`,
    logMessage: true,
    userAction: true
  };
}

module.exports = restartPackageVolumes;
