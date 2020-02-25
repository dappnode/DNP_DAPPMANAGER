import path from "path";
import {
  uniqBy,
  concat,
  pickBy,
  mapValues,
  omit,
  omitBy,
  isObject,
  isEmpty
} from "lodash";
import {
  PortProtocol,
  PortMapping,
  PackageEnvs,
  Compose,
  VolumeMapping,
  ComposeService,
  Manifest,
  UserSettings,
  ComposeVolumes
} from "../types";
import params from "../params";
import {
  writeMetadataToLabels,
  writeDefaultsToLabels,
  readDefaultsFromLabels
} from "./containerLabelsDb";

export const mountpointDevicePrefix = params.MOUNTPOINT_DEVICE_PREFIX;
export const legacyTag = params.MOUNTPOINT_DEVICE_LEGACY_TAG;
const containerNamePrefix = params.CONTAINER_NAME_PREFIX;
const containerCoreNamePrefix = params.CONTAINER_CORE_NAME_PREFIX;
const userSettingDisableTag = params.USER_SETTING_DISABLE_TAG;

let userSettingsType: UserSettings;
const legacyDefaultVolumes: { [dnpName: string]: string[] } = {
  "bitcoin.dnp.dappnode.eth": ["bitcoin_data:/root/.bitcoin"]
};

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

export function getContainerName(name: string, isCore: boolean): string {
  // Note: the prefixes already end with the character "-"
  return `${isCore ? containerCoreNamePrefix : containerNamePrefix}${name}`;
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
    avatar,
    origin,
    isCore
  }: {
    metadata: Manifest;
    avatar: string;
    origin?: string;
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
            avatar,
            chain: metadata.chain,
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
export function parseUserSetFromCompose(compose: Compose): UserSettings {
  const service = parseService(compose);
  const serviceName = parseServiceName(compose);
  const { defaultVolumes, hasDefaults } = readDefaultsFromLabels(
    service.labels || {}
  );

  // Store original envs and do a diff
  const environment = parseEnvironment(service.environment || []);

  // Take into account ephemeral ports which are auto-generated
  const portMappings: typeof userSettingsType.portMappings = {};
  for (const port of parsePortMappings(service.ports || []))
    portMappings[getPortMappingId(port)] = String(port.host || "");

  // Fetch mountpoints
  // also, non-assigned mountpoints must be added in user settings so it
  // can be modified by the user in the UI. If it's value is "", it will be ignored
  // [NOTE]: Ignores volume declarations that are not used in the service
  const volumes = parseVolumeMappings(service.volumes || []);
  const namedVolumeMountpoints: typeof userSettingsType.namedVolumeMountpoints = {};
  if (compose.volumes)
    for (const [volumeName, volObj] of Object.entries(compose.volumes))
      if (volumes.find(vol => vol.host === volumeName) && !volObj.external)
        if (volObj.driver_opts && volObj.driver_opts.device) {
          const devicePath = volObj.driver_opts.device;
          const mountpoint = parseDevicePathMountpoint(devicePath);
          if (mountpoint) namedVolumeMountpoints[volumeName] = mountpoint;
        } else {
          namedVolumeMountpoints[volumeName] = "";
        }

  // ##### <DEPRECATED> Kept for legacy compatibility
  // Check if there are any named volume mappings stored in the metadata tags
  // To be backwards compatible, a few key DNP named volume mappings are hardcoded
  // legacyDefaultVolumes will only apply for legacy DNPs without defaults in labels
  const parsedDefaultVolumes = parseVolumeMappings(
    hasDefaults ? defaultVolumes : legacyDefaultVolumes[serviceName] || []
  );
  // defaultVolumes = ["bitcoin_data:/usr/data"], volumes = ["/dev0/user-set-path:/usr/data"]
  for (const defaultVol of parsedDefaultVolumes) {
    if (defaultVol.name) {
      // Only consider this setting if there is exactly ONE mapping for the container path
      const [currentVol, otherVol] = volumes.filter(
        v => v.container === defaultVol.container
      );
      if (!otherVol && currentVol.name !== defaultVol.name)
        namedVolumeMountpoints[defaultVol.name] = legacyTag + currentVol.host;
    }
  }
  // ##### </DEPRECATED>

  return {
    environment,
    portMappings,
    namedVolumeMountpoints
  };
}

export function applyUserSet(
  compose: Compose,
  userSettings: UserSettings
): Compose {
  const serviceName = parseServiceName(compose);
  const service = compose.services[serviceName];

  // Default values
  const prevEnvironment = service.environment || [];
  const prevPorts = service.ports || [];
  const prevVolumes = service.volumes || [];

  // Load envs, ports, and volumes
  const environment = parseEnvironment(prevEnvironment);
  const portMappings = parsePortMappings(prevPorts);
  const volumeMappings = parseVolumeMappings(prevVolumes);

  // User set
  const domainAlias = userSettings.domainAlias;
  const userSetEnvironment = userSettings.environment || {};
  const userSetPortMappings = userSettings.portMappings || {};
  const allNamedVolumeMountpoint = userSettings.allNamedVolumeMountpoint;
  const userSetMountpoints: typeof userSettingsType.namedVolumeMountpoints = {};
  const userSetNamedVolumePaths: typeof userSettingsType.namedVolumeMountpoints = {};
  for (const [volumeName, mountpoint] of Object.entries(
    userSettings.namedVolumeMountpoints || {}
  ))
    if (mountpoint.startsWith(legacyTag))
      userSetNamedVolumePaths[volumeName] = mountpoint.split(legacyTag)[1];
    else userSetMountpoints[volumeName] = mountpoint;

  // New values
  const nextEnvironment = stringifyEnvironment(
    mapValues(
      environment,
      (envValue, envName) => userSetEnvironment[envName] || envValue
    )
  );

  const nextPorts = stringifyPortMappings(
    portMappings.map(portMapping => {
      const portId = getPortMappingId(portMapping);
      const userSetHost = parseInt(userSetPortMappings[portId]);
      // Use `in` operator to tolerate empty hosts (= ephemeral port)
      return portId in userSetPortMappings
        ? { ...portMapping, host: userSetHost || undefined }
        : portMapping;
    })
  );

  const nextServiceVolumes = stringifyVolumeMappings(
    volumeMappings.map(vol => {
      const userSetHost = userSetNamedVolumePaths[vol.name || ""];
      if (vol.name && userSetHost) {
        // Make sure only a bind volume is created
        if (!path.isAbsolute(userSetHost))
          throw Error(
            `user set volume path for ${serviceName} must be an absolute path: ${userSetHost}`
          );
        // If there is a setting, change the volume to bind by removing vol.name
        return { ...omit(vol, "name"), host: userSetHost };
      } else {
        return vol;
      }
    })
  );

  // Volume section edits
  const nextComposeVolumes: ComposeVolumes = {};
  const dnpName = serviceName;
  const volumes = compose.volumes;

  // Apply general mountpoint to all volumes
  if (
    allNamedVolumeMountpoint &&
    volumes &&
    // #### TEMP: Tag set in fetchDnpRequest
    allNamedVolumeMountpoint !== userSettingDisableTag
  )
    for (const [volumeName, volumeObj] of Object.entries(volumes))
      if (!volumeObj.external)
        nextComposeVolumes[volumeName] = {
          /* eslint-disable-next-line @typescript-eslint/camelcase */
          driver_opts: {
            type: "none",
            device: getDevicePath({
              mountpoint: allNamedVolumeMountpoint,
              dnpName,
              volumeName
            }),
            o: "bind"
          }
        };

  // User set mountpoints for named volumes
  for (const [volumeName, mountpoint] of Object.entries(userSetMountpoints))
    if (
      mountpoint &&
      volumes &&
      volumes[volumeName] &&
      !volumes[volumeName].external
    )
      nextComposeVolumes[volumeName] = {
        /* eslint-disable-next-line @typescript-eslint/camelcase */
        driver_opts: {
          type: "none",
          device: getDevicePath({ mountpoint, dnpName, volumeName }),
          o: "bind"
        }
      };

  return {
    ...compose,
    services: {
      [serviceName]: {
        ...service,
        // Apply user setting only if there are
        ...omitBy(
          {
            environment: nextEnvironment,
            ports: nextPorts,
            volumes: nextServiceVolumes
          },
          el => isObject(el) && isEmpty(el)
        ),
        // Add the default values as labels
        labels: {
          ...service.labels,
          ...writeDefaultsToLabels({
            defaultEnvironment: prevEnvironment,
            defaultPorts: prevPorts,
            defaultVolumes: prevVolumes
          }),
          ...writeMetadataToLabels({ domainAlias })
        }
      }
    },
    // Only add volumes property if necessary, keep the compose clean
    ...(isEmpty(volumes)
      ? {}
      : { volumes: { ...volumes, ...nextComposeVolumes } })
  };
}

/**
 * Gets a device path and sanitizes the parts
 * - For dnpName and volumeName only tolerates
 *   alphanumeric characters and "-", "."
 * - The mountpoint must be an absolute path
 *
 * @return devicePath = "/dev1/data/dappnode-volumes/bitcoin.dnp.dappnode.eth/data"
 */
export function getDevicePath({
  mountpoint,
  dnpName,
  volumeName
}: {
  mountpoint: string;
  dnpName: string;
  volumeName: string;
}): string {
  if (!path.isAbsolute(mountpoint))
    throw Error(
      `mountpoint path for '${dnpName} - ${volumeName}' must be an absolute path: ${mountpoint}`
    );

  const stripCharacters = (s: string): string =>
    s
      .replace(/[`~!@#$%^&*()|+=?;:'",<>\{\}\[\]\\\/]/gi, "")
      .replace(/\.+/, ".");

  return path.join(
    mountpoint,
    mountpointDevicePrefix,
    stripCharacters(dnpName),
    stripCharacters(volumeName)
  );
}

/**
 * Reverses the result of `getDevicePath`
 * @param devicePath "/dev1/data/dappnode-volumes/bitcoin.dnp.dappnode.eth/data"
 * @return path parts = {
 *   mountpoint: "/dev1/data",
 *   dnpName: "bitcoin.dnp.dappnode.eth",
 *   volumeName: "data",
 *   volumePath: "bitcoin.dnp.dappnode.eth/data",
 *   mountpointPath: "/dev1/data/dappnode-volumes"
 * }
 */
export function parseDevicePath(
  devicePath: string
):
  | {
      mountpoint: string;
      dnpName: string;
      volumeName: string;
      volumePath: string;
      mountpointPath: string;
    }
  | undefined {
  const [mountpoint, dnpNameAndVolumeName] = devicePath.split(
    "/" + mountpointDevicePrefix + "/"
  );
  if (!dnpNameAndVolumeName) return;
  const [dnpName, volumeName] = dnpNameAndVolumeName.split("/");
  if (!volumeName) return;
  return {
    mountpoint: path.normalize(mountpoint),
    dnpName,
    volumeName,
    volumePath: dnpNameAndVolumeName,
    mountpointPath: path.join(mountpoint, mountpointDevicePrefix)
  };
}

export function parseDevicePathMountpoint(
  devicePath: string
): string | undefined {
  const pathParts = parseDevicePath(devicePath);
  return pathParts ? pathParts.mountpoint : undefined;
}
