const params = require("params");
// Modules
const dockerList = require("modules/dockerList");
// Utils
const parse = require("utils/parse");
const getPath = require("utils/getPath");
const { stringIncludes } = require("utils/strings");
// External call
const restartPackage = require("./restartPackage");

/**
 * Updates the .env file of a package. If requested, also re-ups it
 *
 * @param {string} id DNP .eth name
 * @param {array} portMappings [
 *   { host: 30444, container: 30303, protocol: "UDP" },
 *   { host: 4000, container: 4000, protocol: "TCP" }
 * ]
 * #### !!!!! NOTE take into account existing ephemeral ports
 */
const updatePortMappings = async ({ id, portMappings }) => {
  if (!id) throw Error("kwarg id must be defined");
  if (!Array.isArray(portMappings))
    throw Error("kwarg portMappings must be an array");

  /**
   * 1. Fetch existing port mappings
   * @param {array} dcPorts = [
   *   { host: 30444, container: 30303, protocol: "UDP" }
   * ]
   */
  const dnpList = await dockerList.listContainers();
  const dnp = dnpList.find(_dnp => stringIncludes(_dnp.name, id));
  if (!dnp) {
    throw Error(`No DNP was found for name ${id}`);
  }
  const dockerComposePath = getPath.dockerCompose(dnp.name, params, dnp.isCore);
  const dcPorts = parse.dockerComposePorts(dockerComposePath);

  /**
   * 2. Merge existing port mappings with new port mappings
   * - Has to compute mergedPortMappings
   * - [Ports to close]: Maybe not since the new natRenewal will automatically drop them
   * - [Ports to open]: Can the natRenewal be triggered for a specific DNP?
   * - [Locked ports]: The object in the container label has to be edited
   * #### TODO: Since now there is the natRenewal, is the portsToClose array necessary anymore?
   */
  const mergedPortMappings = mergePortMappings(dcPorts, portMappings);

  /**
   * 3. Apply new merged port mappings
   */
  const dcObject = parse.editDockerComposePorts(
    dockerComposePath,
    mergedPortMappings
  );
  parse.writeDockerCompose(dockerComposePath, dcObject);

  // restartPackage triggers a eventBus.emit(eventBusTag.emitPackages);
  await restartPackage({ id });

  return {
    message: `Updated ${id} port mappings`,
    logMessage: true,
    userAction: true
  };
};

// Utils

function mergePortMappings(portMappings1, portMappings2) {
  return Object.values({
    ...transformPortMappingToObject(portMappings1),
    ...transformPortMappingToObject(portMappings2)
  });
}

function transformPortMappingToObject(portMappings) {
  portMappings.reduce((obj, portMapping) => {
    if (!container) throw Error(`Invalid portMapping, key container is null`);
    const { container, type = "tcp" } = portMapping;
    return { ...obj, [`${container}/${type.toLowerCase()}`]: portMapping };
  }, {});
}

module.exports = updatePortMappings;
