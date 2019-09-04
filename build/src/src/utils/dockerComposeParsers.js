"use strict";
/**
 * Internal methods that purely modify JSON
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Parses a port string array from a docker-compose.yml
 *
 * @param portsArray Should come from a parsed docker-compose.yml
 *   ["30505:4001/udp", "30505:4001"]
 * @returns PortMapping array
 *   [{ host: 30444, container: 30303, protocol: "UDP" }, ...]
 *
 */
function parsePortMappings(portsArray) {
  return portsArray.map(portString => {
    const [portMapping, protocolString = ""] = portString.split("/");
    // Make sure the protocol is correct
    const protocolParsed =
      protocolString.toLowerCase() === "udp" ? "UDP" : "TCP";
    // Cast the protocolString to a PortProtocol type
    const protocol = protocolParsed;
    let [host, container] = portMapping.split(":");
    // HOST:CONTAINER/protocol, return [HOST, CONTAINER/protocol]
    if (container) return { host, container, protocol };
    // CONTAINER/protocol, return [null, CONTAINER/protocol]
    else return { container: host, protocol };
  });
}
exports.parsePortMappings = parsePortMappings;
/**
 * Stringifies a PortMapping array to be compatible for a docker-compose.yml
 *
 * @param portMappings array
 *   [{ host: 30444, container: 30303, protocol: "UDP" }, ...]
 * @returns portsArray ready for a docker-compose.yml
 *   ["30505:4001/udp", "30505:4001"]
 */
function stringifyPortMappings(portMappings) {
  // Stringify ports
  return portMappings.map(({ host, container, protocol }) => {
    const parsedProtocol =
      (protocol || "").toLowerCase() === "udp" ? "/udp" : "";
    return host
      ? // HOST:CONTAINER/protocol, if HOST
        [host, container].join(":") + parsedProtocol
      : // CONTAINER/protocol, if no HOST
        container + parsedProtocol;
  });
}
exports.stringifyPortMappings = stringifyPortMappings;
/**
 * Merges two port mapping arrays ensuring container ports are unique.
 * If there are duplicate mappings for the same container port number and protocol,
 * the latter mapping will overwrite the others.
 *
 * @param portMappings1 PortMapping array with LESS priority
 * @param portMappings2 PortMapping array with MORE priority
 * @returns merged PortMapping array
 */
function mergePortMappings(portMappings1, portMappings2) {
  // Give each port mapping a deterministic key so mappings targeting
  // the same container port number and protocol get overwritten
  function transformPortMappingToObject(portMappings) {
    return portMappings.reduce((obj, portMapping) => {
      const { container, protocol } = portMapping;
      if (!container) throw Error(`Invalid portMapping, key container is null`);
      // Construct a unique key per container port number and protocol
      return Object.assign({}, obj, {
        [`${container}/${protocol || "TCP"}`]: portMapping
      });
    }, {});
  }
  const mergedPortMappings = Object.values(
    Object.assign(
      {},
      transformPortMappingToObject(portMappings1),
      transformPortMappingToObject(portMappings2)
    )
  );
  // Make the order deterministic, by port number and then TCP first
  return mergedPortMappings.sort(function(a, b) {
    function numGetter(portMapping) {
      return (
        parseInt(portMapping.container) +
        (portMapping.protocol === "UDP" ? 0.5 : 0)
      );
    }
    return numGetter(a) - numGetter(b);
  });
}
exports.mergePortMappings = mergePortMappings;
