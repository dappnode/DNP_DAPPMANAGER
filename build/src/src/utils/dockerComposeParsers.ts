import path from "path";
import { uniqBy, concat, pickBy, fromPairs, toPairs, mapValues } from "lodash";
import {
  PortProtocol,
  PortMapping,
  PackageEnvs,
  Compose,
  VolumeMapping,
  ComposeService,
  UserSetPackageVolsSingle,
  Manifest,
  UserSet,
  UserSetPackageEnvs,
  UserSetPackageVols,
  UserSetPackagePorts,
  UserSetByDnp
} from "../types";
import params from "../params";
import {
  writeMetadataToLabels,
  writeDefaultsToLabels
} from "./containerLabelsDb";

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
export function normalizeVolumePath(volumePath: string): string {
  // Remove trailing slash
  if (!volumePath) return "";
  if (volumePath === "/") return volumePath;
  return path.normalize(volumePath.replace(/\/+$/, ""));
}

/**
 * Parses an array of volumes from the service section
 * - Ignores broken volume mappings, where there is no container path
 *   "/host/path:", "/host/path"
 * @param volumesArray
 */
export function parseVolumeMappings(volumesArray: string[]): VolumeMapping[] {
  return volumesArray
    .map(volString => {
      const [host, container] = volString
        .split(/:(.*)/)
        .map(normalizeVolumePath);
      const isNamed = !host.startsWith("/") && !host.startsWith("~");
      return {
        host,
        container,
        name: isNamed ? host : undefined
      };
    })
    .filter(({ container }) => container);
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

/**
 * Returns a new compose object with default data appended to it
 * - logging data to prevent huge logs
 * - custom labels to store: dependencies, chain, origin, isCore
 * - common dns
 * - DAppNode internal network
 */
export function addGeneralDataToCompose(
  compose: Compose,
  {
    metadata,
    origin,
    isCore
  }: {
    metadata: Manifest;
    origin: string;
    isCore: boolean;
  }
): Compose {
  const serviceName = parseServiceName(compose);
  const service = compose.services[serviceName];

  return {
    ...compose,
    services: {
      [serviceName]: {
        ...service,
        // Add logging options to prevent huge log files
        logging: {
          options: {
            "max-size": "10m",
            "max-file": "3"
          }
        },
        // Add custom labels
        labels: {
          ...service.labels,
          ...writeMetadataToLabels({
            dependencies: metadata.dependencies || {},
            chain: metadata.chain || "",
            origin,
            isCore
          })
        },
        // Add common DNS
        dns: params.DNS_SERVICE,
        // Add network settings
        ...(!isCore ? { networks: [params.DNP_NETWORK_EXTERNAL_NAME] } : {})
      }
    },
    networks: !isCore
      ? {
          [params.DNP_NETWORK_EXTERNAL_NAME]: {
            external: true
          }
        }
      : compose.networks || {}
  };
}

function getPortMappingId(portMapping: PortMapping): string {
  return `${portMapping.container}/${portMapping.protocol}`;
}

/**
 * Returns the user settings applied to this compose
 * This function works in coordination with other parsers to
 * correctly store and differentiate which settings are from the
 * user and which are not
 */
export function parseUserSet(fromCompose: {
  environment: string[];
  ports: string[];
  volumes: string[];
}): UserSet {
  // Store original envs and do a diff
  const envs = parseEnvironment(fromCompose.environment);
  // Take into account ephemeral ports which are auto-generated
  const ports = parsePortMappings(fromCompose.ports);
  const volumeMappings = parseVolumeMappings(fromCompose.volumes);

  return {
    environment: envs,
    portMappings: ports.reduce(
      (obj: { [containerPortAndProtocol: string]: string }, port) => {
        return {
          ...obj,
          [getPortMappingId(port)]: String(port.host || "")
        };
      },
      {}
    ),
    namedVolumeMappings: volumeMappings.reduce(
      (obj: { [namedVolumeContainerPath: string]: string }, vol) => {
        return {
          ...obj,
          [vol.container]: vol.name || vol.host
        };
      },
      {}
    )
  };
}

/**
 * Returns the user settings applied to this compose
 * This function works in coordination with other parsers to
 * correctly store and differentiate which settings are from the
 * user and which are not
 */
export function parseUserSetFromCompose(compose: Compose): UserSet {
  const service = parseService(compose);
  return parseUserSet({
    environment: service.environment || [],
    ports: service.ports || [],
    volumes: service.volumes || []
  });
}

export function applyUserSet(compose: Compose, userSet: UserSet): Compose {
  const serviceName = parseServiceName(compose);
  const service = compose.services[serviceName];

  // Load envs, ports, and volumes
  const envs = parseEnvironment(service.environment || []);
  const ports = parsePortMappings(service.ports || []);
  const volumeMappings = parseVolumeMappings(service.volumes || []);

  // Default values
  const defaultEnvironment = service.environment || [];
  const defaultVolumes = service.volumes || [];
  const defaultPorts = service.ports || [];

  // User set
  const userSetEnvironment = userSet.environment || {};
  const userSetPortMappings = userSet.portMappings || {};
  const userSetVolumeMappings = userSet.namedVolumeMappings || {};

  return {
    ...compose,
    services: {
      [serviceName]: {
        ...service,
        // Apply user set envs replacing by ENV name
        environment: stringifyEnvironment(
          mapValues(
            envs,
            (envValue, envName) => userSetEnvironment[envName] || envValue
          )
        ),
        ports: stringifyPortMappings(
          ports.map(port => {
            const portId = getPortMappingId(port);
            if (portId in userSetPortMappings) {
              const userSetHost = userSetPortMappings[portId];
              return {
                ...port,
                host: userSetHost ? parseInt(userSetHost) : undefined
              };
            } else return port;
          })
        ),
        volumes: stringifyVolumeMappings(
          volumeMappings.map(vol => {
            const userSetHost = userSetVolumeMappings[vol.container];
            if (vol.name && userSetHost)
              return {
                ...vol,
                host: userSetHost
              };
            else return vol;
          })
        ),
        /**
         * Add the default values as labels
         */
        labels: {
          ...service.labels,
          ...writeDefaultsToLabels({
            defaultEnvironment,
            defaultVolumes,
            defaultPorts
          })
        }
      }
    }
  };
}

/**
 * Convert legacy userSet*** to userSet
 *
 * @param {object} userSetEnvs
 * userSetEnvs= {
 *   "kovan.dnp.dappnode.eth": {
 *     "ENV_NAME": "VALUE1"
 * }, ... }
 * @param {object} userSetVols user set volumes
 * userSetVols = {
 *   "kovan.dnp.dappnode.eth": {
 *     "kovan:/root/.local/share/io.parity.ethereum/": "different_name"
 * }, ... }
 * @param {object} userSetPorts user set ports
 * userSetPorts = {
 *   "kovan.dnp.dappnode.eth": {
 *     "30303": "31313:30303",
 *     "30303/udp": "31313:30303/udp"
 * }, ... }
 *
 * @param {object} userSet {
 *   environment: { "NAME": "NEW_VALUE" }
 *   namedVolumeMappings: { "/usr/container": "/dev0/user-set-path" }
 *   portMappings: { "4001/TCP": "4111", "9090/UDP": "" }
 * }
 */
export function convertUserSetLegacy({
  userSetEnvs,
  userSetVols,
  userSetPorts
}: {
  userSetEnvs?: UserSetPackageEnvs;
  userSetVols?: UserSetPackageVols;
  userSetPorts?: UserSetPackagePorts;
}): UserSetByDnp {
  const dnpNames = Object.keys({
    ...(userSetEnvs || {}),
    ...(userSetVols || {}),
    ...(userSetPorts || {})
  });

  const userSetByDnp: UserSetByDnp = {};

  for (const name of dnpNames) {
    userSetByDnp[name] = parseUserSet({
      environment: stringifyEnvironment((userSetEnvs || {})[name] || {}),
      ports: Object.values((userSetPorts || {})[name] || {}),
      volumes: Object.values((userSetVols || {})[name] || {})
    });
  }

  return userSetByDnp;
}
