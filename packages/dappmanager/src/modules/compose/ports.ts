import { PortMapping, PortProtocol } from "@dappnode/common";
import { uniqBy, concat } from "lodash-es";

/**
 * Parses a port string array from a docker-compose.yml
 *
 * @param portsArray Should come from a parsed docker-compose.yml
 *   ["30505:4001/udp", "30505:4001"]
 */
export function parsePortMappings(portsArray: string[]): PortMapping[] {
  return portsArray.map((portString): PortMapping => {
    const [portMapping, protocolString = ""] = portString.split("/");

    // Make sure the protocol is correct
    const protocolParsed =
      protocolString.toLowerCase() === "udp"
        ? PortProtocol.UDP
        : PortProtocol.TCP;
    const [hostString, containerString] = portMapping.split(":");

    // Convert to appropiate types + Cast to a PortProtocol type
    const host = parseInt(hostString);
    const container = parseInt(containerString);
    const protocol = protocolParsed;

    return container
      ? // HOST:CONTAINER/protocol, return [HOST, CONTAINER/protocol]
        { host, container, protocol }
      : // CONTAINER/protocol, return [null, CONTAINER/protocol]
        { container: host, protocol };
  });
}

/**
 * Stringifies a PortMapping array to be compatible for a docker-compose.yml
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
 * Merges ensuring container ports are unique.
 * If there are duplicate mappings for the same
 * container port number and protocol,
 * the latter mapping will overwrite the others.
 *
 * @param portMappings1 PortMapping array with MORE priority
 * @param portMappings2 PortMapping array with LESS priority
 * @returns merged PortMapping array
 */
export function mergePortMappings(
  portMappings1: PortMapping[],
  portMappings2: PortMapping[]
): PortMapping[] {
  // Give each port mapping a deterministic key so mappings targeting
  // the same container port number and protocol get overwritten
  return uniqBy(
    concat(portMappings1, portMappings2),
    ({ container, protocol }: PortMapping) =>
      `${container}/${protocol || "TCP"}`
  );
}

export function mergePortArrays(
  portArray1: string[],
  portArray2: string[]
): string[] {
  return stringifyPortMappings(
    mergePortMappings(
      parsePortMappings(portArray1),
      parsePortMappings(portArray2)
    )
  );
}
