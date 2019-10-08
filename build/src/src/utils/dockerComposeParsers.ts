import path from "path";
import { uniqBy, concat, pickBy, fromPairs, toPairs } from "lodash";
import {
  PortProtocol,
  PortMapping,
  PackageEnvs,
  Compose,
  VolumeMapping,
  ComposeService,
  UserSetPackageVolsSingle
} from "../types";

/**
 * Internal methods that purely modify JSON
 */

/**
 * Returns the first name of a compose. It will match the DNP name ENS domain
 */
export function parseServiceName(compose: Compose): string {
  return Object.keys(compose.services)[0];
}

export function parseService(compose: Compose): ComposeService {
  return compose.services[parseServiceName(compose)];
}

/**
 * Parses an envs array from a manifest or docker-compose.yml
 * [NOTE]: protect against faulty lines: envsArray = [""], they can break a compose
 * - Filter by row.trim()
 * - Make sure the key is define before adding to the envs object
 * @param envsArray:
 * ["NAME=VALUE",  "NOVAL",   "COMPLEX=D=D=D  = 2"]
 * @returns envs =
 * { NAME: "VALUE", NOVAL: "", COMPLEX: "D=D=D  = 2" }
 */
export function parseEnvironment(envsArray: string[]): PackageEnvs {
  return envsArray
    .filter(row => (row || "").trim())
    .reduce((envs: PackageEnvs, row) => {
      const [key, value] = (row || "").trim().split(/=(.*)/);
      return key ? { ...envs, [key]: value || "" } : envs;
    }, {});
}

/**
 * Reverse of parseEnvironment, stringifies envs object to envsArray
 * @param envs =
 * { NAME: "VALUE", NOVAL: "", COMPLEX: "D=D=D  = 2" }
 * @returns envsArray =
 * ["NAME=VALUE",  "NOVAL",   "COMPLEX=D=D=D  = 2"]
 */
export function stringifyEnvironment(envs: PackageEnvs): string[] {
  return Object.entries(envs)
    .filter(([name]) => name)
    .map(([name, value]) => (value ? [name, value].join("=") : name));
}

/**
 * Merges filtering faulty ENV names that invalidates a docker-compose.
 * environment:
 *   - ""
 * The previous docker-compose.yml snippet is invalid
 *
 * @param envs1 package envs with MORE priority
 * @param envs2 package envs with LESS priority
 * @returns merged package envs
 */
export function mergeEnvs(envs1: PackageEnvs, envs2: PackageEnvs): PackageEnvs {
  return pickBy(
    {
      ...envs2,
      ...envs1
    },
    (_0, key) => key
  );
}

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

/**
 * Normalizes volume paths, removes trailing slash
 * - "/"                => "/"
 * - "/root/.ethereum/" => "/root/.ethereum"
 * - "data"             => "data"
 */
export function normalizeVolumePath(volumePath: string) {
  // Remove trailing slash
  if (volumePath === "/") return volumePath;
  return path.normalize(volumePath.replace(/\/+$/, ""));
}

/**
 * Parses an array of volumes from the service section
 * @param volumesArray
 */
export function parseVolumeMappings(volumesArray: string[]): VolumeMapping[] {
  return volumesArray.map(volString => {
    const [host, container] = volString.split(/:(.*)/);
    const isNamed = !host.startsWith("/") && !host.startsWith("~");
    return {
      host: normalizeVolumePath(host),
      container: normalizeVolumePath(container),
      name: isNamed ? host : undefined
    };
  });
}

export function stringifyVolumeMappings(
  volumeMappings: VolumeMapping[]
): string[] {
  return volumeMappings.map(({ host, container }) =>
    [host, container].join(":")
  );
}

/**
 * Merges ensuring container paths are unique.
 * If there are duplicate mappings for the same container path,
 * the latter mapping will overwrite the others.
 *
 * @param volumeMappings1 VolumeMapping array with MORE priority
 * @param volumeMappings2 VolumeMapping array with LESS priority
 * @returns merged VolumeMapping array
 */
export function mergeVolumeMappings(
  volumeMappings1: VolumeMapping[],
  volumeMappings2: VolumeMapping[]
): VolumeMapping[] {
  return uniqBy(
    concat(volumeMappings1, volumeMappings2),
    ({ container }: VolumeMapping) => container
  );
}

export function mergeVolumeArrays(
  volumeArray1: string[],
  volumeArray2: string[]
): string[] {
  return stringifyVolumeMappings(
    mergeVolumeMappings(
      parseVolumeMappings(volumeArray1),
      parseVolumeMappings(volumeArray2)
    )
  );
}

export function mergeUserSetVolumes(
  currentVolumes: string[],
  userSetVolumes: UserSetPackageVolsSingle
) {
  // Normalize userSetVolumes so they catch the current ones
  const userSetDnpVolsNormalized: UserSetPackageVolsSingle = fromPairs(
    toPairs(userSetVolumes).map(pair => pair.map(normalizeVolumePath))
  );

  return currentVolumes.map(vol => userSetDnpVolsNormalized[vol] || vol);
}
