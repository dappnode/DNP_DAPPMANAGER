import { PortProtocol, PortMapping } from "../types";

/**
 * Internal methods that purely modify JSON
 */

/**
 * Parses a port string array from a docker-compose.yml
 *
 * @param portsArray Should come from a parsed docker-compose.yml
 *   ["30505:4001/udp", "30505:4001"]
 * @returns PortMapping array
 *   [{ host: 30444, container: 30303, protocol: "UDP" }, ...]
 *
 */
export function parsePortMappings(portsArray: string[]): PortMapping[] {
  return portsArray.map(portString => {
    const [portMapping, protocolString = ""] = portString.split("/");

    // Make sure the protocol is correct
    const protocolParsed =
      protocolString.toLowerCase() === "udp" ? "UDP" : "TCP";
    const [hostString, containerString] = portMapping.split(":");

    // Convert to appropiate types + Cast to a PortProtocol type
    const host = parseInt(hostString);
    const container = parseInt(containerString);
    const protocol = protocolParsed as PortProtocol;

    // HOST:CONTAINER/protocol, return [HOST, CONTAINER/protocol]
    if (container) return { host, container, protocol };
    // CONTAINER/protocol, return [null, CONTAINER/protocol]
    else return { container: host, protocol };
  });
}

/**
 * Stringifies a PortMapping array to be compatible for a docker-compose.yml
 *
 * @param portMappings array
 *   [{ host: 30444, container: 30303, protocol: "UDP" }, ...]
 * @returns portsArray ready for a docker-compose.yml
 *   ["30505:4001/udp", "30505:4001"]
 */
export function stringifyPortMappings(portMappings: PortMapping[]): string[] {
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

/**
 * Merges two port mapping arrays ensuring container ports are unique.
 * If there are duplicate mappings for the same container port number and protocol,
 * the latter mapping will overwrite the others.
 *
 * @param portMappings1 PortMapping array with LESS priority
 * @param portMappings2 PortMapping array with MORE priority
 * @returns merged PortMapping array
 */
export function mergePortMappings(
  portMappings1: PortMapping[],
  portMappings2: PortMapping[]
): PortMapping[] {
  // Give each port mapping a deterministic key so mappings targeting
  // the same container port number and protocol get overwritten
  function transformPortMappingToObject(portMappings: PortMapping[]) {
    return portMappings.reduce((obj, portMapping) => {
      const { container, protocol } = portMapping;
      if (!container) throw Error(`Invalid portMapping, key container is null`);
      // Construct a unique key per container port number and protocol
      return { ...obj, [`${container}/${protocol || "TCP"}`]: portMapping };
    }, {});
  }

  const mergedPortMappings: PortMapping[] = Object.values({
    ...transformPortMappingToObject(portMappings1),
    ...transformPortMappingToObject(portMappings2)
  });

  // Make the order deterministic, by port number and then TCP first
  return mergedPortMappings.sort(function(a: PortMapping, b: PortMapping) {
    function numGetter(portMapping: PortMapping) {
      return portMapping.container + (portMapping.protocol === "UDP" ? 0.5 : 0);
    }
    return numGetter(a) - numGetter(b);
  });
}
