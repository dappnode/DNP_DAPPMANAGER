const lockPorts = require("modules/lockPorts");
// Utils
const { getComposeInstance } = require("utils/dockerComposeFile");
const { stringIncludes } = require("utils/strings");
// External call
const restartPackage = require("./restartPackage");
const { eventBus, eventBusTag } = require("eventBus");

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
const updatePortMappings = async ({ id, portMappings, options = {} }) => {
  if (!id) throw Error("kwarg id must be defined");
  if (!Array.isArray(portMappings))
    throw Error("kwarg portMappings must be an array");

  if (id === "dappmanager.dnp.dappnode.eth")
    throw Error("Can not edit DAPPAMANAGER ports");

  /**
   * [NOTE]
   * Assigning ephemeral ports to the DAPPMANAGER can be problematic
   * because since it is reseted, the `lockPorts` function will never
   * be executed.
   * ### TODO: lockPorts will be executed on the DAPPMANAGER start
   * and lock any remaining ephemeral ports of all DNPs
   */

  /**
   * 1. Merge existing port mappings with new port mappings
   * - Has to compute mergedPortMappings
   * - [Ports to close]: Maybe not since the new natRenewal will automatically drop them
   * - [Ports to open]: Can the natRenewal be triggered for a specific DNP?
   * - [Locked ports]: The object in the container label has to be edited
   * #### TODO: Since now there is the natRenewal, is the portsToClose array necessary anymore?
   * @param {array} dcPorts = [
   *   { host: 30444, container: 30303, protocol: "UDP" }
   * ]
   */
  const compose = getComposeInstance(id);
  const previousPortMappings = compose.getPortMappings();
  if (options.merge) compose.mergePortMapping(portMappings);
  else compose.setPortMappings(portMappings);

  // restartPackage triggers a eventBus.emit(eventBusTag.emitPackages);
  try {
    await restartPackage({ id });
  } catch (e) {
    if (stringIncludes(e.message, "port is already allocated")) {
      compose.setPortMappings(previousPortMappings);
      await restartPackage({ id });

      // Try to get the port colliding from the error
      const ipAndPort = (e.message.match(
        /(?:Bind for)(.+)(?:failed: port is already allocated)/
      ) || [])[1];
      const collidingPortNumber = (ipAndPort || "").split(":")[1] || "";

      // Throw error
      throw Error(
        `${
          collidingPortNumber
            ? `Port ${collidingPortNumber} is already mapped`
            : "Port collision"
        }. Reverted port mapping update`
      );
    }
  }

  /**
   * 2. Lock ephemeral ports if any
   */
  await lockPorts(id);

  // Trigger a natRenewal update to open ports if necessary
  eventBus.emit(eventBusTag.runNatRenewal);

  return {
    message: `Updated ${id} port mappings`,
    logMessage: true,
    userAction: true
  };
};

module.exports = updatePortMappings;
