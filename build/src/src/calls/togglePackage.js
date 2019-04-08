const getPath = require("utils/getPath");
const parse = require("utils/parse");
const params = require("params");
const docker = require("modules/docker");
const { eventBus, eventBusTag } = require("eventBus");

/**
 * Stops or starts after fetching its status
 *
 * @param {Object} kwargs: {
 *   id: package .eth name (string)
 *   timeout: seconds to stop the package (int)
 * }
 * @return {Object} A formated success message.
 * result: empty
 */
const togglePackage = async ({ id, timeout = 10 }) => {
  if (!id) throw Error("kwarg id must be defined");

  const dockerComposePath = getPath.dockerComposeSmart(id, params);
  // This parse utility already throws if no docker-compose found
  let containerName = parse.containerName(dockerComposePath);

  let packageState = await docker.status(containerName);

  // docker-compose states my contain extra info, i.e. Exit (137), Up (healthy)
  switch (packageState.split(" ")[0].trim()) {
    case "running":
      await docker.compose.stop(dockerComposePath, { timeout });
      break;
    case "exited":
      await docker.compose.start(dockerComposePath);
      break;
    default:
      throw Error("Unkown state: " + packageState + ", for package: " + id);
  }

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: "successfully toggled package: " + id,
    logMessage: true,
    userAction: true
  };
};

module.exports = togglePackage;
