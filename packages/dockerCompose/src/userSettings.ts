import path from "path";
import { mapValues, pick, omitBy, isObject } from "lodash-es";
import {
  parsePortMappings,
  stringifyPortMappings,
  parseVolumeMappings,
  parseDevicePathMountpoint,
  getDevicePath,
  ComposeFileEditor,
  parseServiceNetworks
} from "./index.js";
import { parseEnvironment } from "@dappnode/utils";
import {
  Compose,
  ComposeServiceNetwork,
  ComposeServiceNetworks,
  ComposeServiceNetworksObj,
  PortMapping,
  UserSettings,
  VolumeMapping
} from "@dappnode/types";
import { cleanCompose, isOmitable } from "./clean.js";
import { stringifyVolumeMappings } from "./volumes.js";
import { readContainerLabels, writeDefaultsToLabels } from "./labelsDb.js";

/**
 * To be backwards compatible with older versions that do not store
 * default volumes. Only DNP with a customizable path was bitcoin
 * Custom volumes array example:
 * volumes = ["/dev0/user-set-path:/usr/data"]
 */
const legacyDefaultVolumes: { [dnpName: string]: string[] } = {
  "bitcoin.dnp.dappnode.eth": ["bitcoin_data:/root/.bitcoin"]
};

export const parseUserSettingsFns: {
  [P in keyof Required<UserSettings>]: (compose: Compose) => UserSettings[P];
} = {
  environment: (compose) => mapValues(compose.services, (service) => parseEnvironment(service.environment || [])),

  networks: (compose) => {
    // There can't be service networks without root networks
    if (!compose.networks) return undefined;

    const serviceNetworks = Object.entries(compose.services).reduce(
      (acc, [serviceName, service]) => {
        if (Array.isArray(service.networks)) {
          // Convert array to object
          acc[serviceName] = ComposeFileEditor.convertNetworkArrayToObject(service.networks);
        } else {
          acc[serviceName] = service.networks || {};
        }
        return acc;
      },
      {} as { [serviceName: string]: ComposeServiceNetworks }
    );

    const rootNetworks = compose.networks;

    return {
      serviceNetworks,
      rootNetworks
    };
  },

  portMappings: (compose) =>
    mapValues(compose.services, (service) => {
      const portMappings: { [containerPortAndType: string]: string } = {};
      for (const port of parsePortMappings(service.ports || []))
        portMappings[getPortMappingId(port)] = String(port.host || "");
      return portMappings;
    }),

  namedVolumeMountpoints: (compose) => {
    const namedVolumeMountpoints: { [volumeName: string]: string } = {};
    for (const [volumeName, volObj] of Object.entries(compose.volumes || {}))
      if (isComposeVolumeUsed(compose, volumeName))
        if (volObj && volObj.driver_opts && volObj.driver_opts.device) {
          const devicePath = volObj.driver_opts.device;
          const mountpoint = parseDevicePathMountpoint(devicePath);
          if (mountpoint) namedVolumeMountpoints[volumeName] = mountpoint;
        } else {
          // Non-assigned mountpoints must be added in user settings so it
          // can be modified by the user in the UI. If it's value is "", it will be ignored
          // [NOTE]: Ignores volume declarations that are not used in the service
          namedVolumeMountpoints[volumeName] = "";
        }
    return namedVolumeMountpoints;
  },

  // ##### <DEPRECATED> Kept for legacy compatibility
  // Check if there are any named volume mappings stored in the metadata tags
  // To be backwards compatible, a few key DNP named volume mappings are hardcoded
  legacyBindVolumes: (compose) =>
    mapValues(compose.services, (service, serviceName) => {
      const volumes = parseVolumeMappings(service.volumes || []);
      const labels = readContainerLabels(service.labels || {});
      const parsedDefaultVolumes = parseVolumeMappings(
        labels.defaultVolumes || legacyDefaultVolumes[serviceName] || []
      );
      const legacyBindVolumes: { [volumeName: string]: string } = {};
      for (const { container, name } of parsedDefaultVolumes)
        if (name) {
          const vol = volumes.find((v) => v.container === container);
          if (vol && vol.host !== name) legacyBindVolumes[name] = vol.host;
        }
      return legacyBindVolumes;
    }),
  // ##### </DEPRECATED>

  allNamedVolumeMountpoint: () => undefined,
  domainAlias: () => undefined,
  fileUploads: () => ({})
};

/**
 * Returns the user settings applied to this compose
 * This function works in coordination with other parsers to
 * correctly store and differentiate which settings are from the
 * user and which are not
 */
export function parseUserSettings(compose: Compose): UserSettings {
  const userSettings = mapValues(parseUserSettingsFns, (parseUserSettingsFn) => parseUserSettingsFn(compose));
  // Ignore objects that are empty to make tests and payloads cleaner
  return omitBy(
    userSettings,
    (value) =>
      isOmitable(value) ||
      // Remove nested empty objects
      (isObject(value) && Object.values(value).every(isOmitable))
  );
}

/**
 * Applies user settings to a compose
 * @param compose
 * @param userSettingsServices
 * @param skipLabels Use for testing to disable storing the defaults in the compose labels
 */
export function applyUserSettings(
  compose: Compose,
  userSettings: UserSettings,
  { dnpName }: { dnpName: string }
): Compose {
  const nextServices = mapValues(compose.services, (service, serviceName) => {
    // Load envs, ports, and volumes
    const environment = parseEnvironment(service.environment || {});
    const portMappings = parsePortMappings(service.ports || []);
    const volumeMappings = parseVolumeMappings(service.volumes || []);
    const networks = parseServiceNetworks(service.networks || {});

    // User set
    const userSetEnvironment = (userSettings.environment || {})[serviceName] || {};
    const userSetPortMappings = (userSettings.portMappings || {})[serviceName] || {};
    const userSetLegacyBindVolumes = (userSettings.legacyBindVolumes || {})[serviceName] || {};
    const userSetNetworks = parseServiceNetworks((userSettings.networks?.serviceNetworks || {})[serviceName] || {});

    // New values
    const nextEnvironment = mapValues(environment, (envValue, envName) => userSetEnvironment[envName] || envValue);

    const nextPorts = stringifyPortMappings(
      portMappings.map((portMapping): PortMapping => {
        const portId = getPortMappingId(portMapping);
        const userSetHost = parseInt(userSetPortMappings[portId]);
        // Use `in` operator to tolerate empty hosts (= ephemeral port)
        return portId in userSetPortMappings ? { ...portMapping, host: userSetHost || undefined } : portMapping;
      })
    );

    // Function to ensure types are correct and enforce Compose file compatibility
    const normalizeNetwork = (network: ComposeServiceNetwork): ComposeServiceNetwork => {
      const normalized: ComposeServiceNetwork = {};
      // Only add aliases if the array is non-empty
      if (Array.isArray(network.aliases) && network.aliases.length > 0) {
        normalized.aliases = network.aliases;
      }
      // Only add ipv4_address if it is defined (not undefined)
      if (network.ipv4_address) {
        normalized.ipv4_address = network.ipv4_address;
      }
      return normalized;
    };

    // Function to merge base and user networks, ensuring proper type for ipv4_address and aliases
    const mergeNetworks = (
      base: ComposeServiceNetworksObj,
      user: ComposeServiceNetworksObj
    ): ComposeServiceNetworksObj => {
      const merged: ComposeServiceNetworksObj = {};

      // Iterate over the keys of the base networks
      for (const networkName in base) {
        merged[networkName] = { ...base[networkName] }; // Start with a shallow copy of the base network

        if (user[networkName]) {
          // If the user has provided overrides for this network, merge them
          for (const subKey in user[networkName]) {
            if (subKey === "ipv4_address") {
              merged[networkName].ipv4_address = base[networkName].ipv4_address; // Always take base ipv4_address
            } else if (subKey === "aliases") {
              // Merge and deduplicate aliases
              const baseAliases = base[networkName].aliases || [];
              const userAliases = user[networkName].aliases || [];
              merged[networkName].aliases = Array.from(new Set([...baseAliases, ...userAliases]));
            }
          }
        } else {
          // If user doesn't have settings for the network, just copy the base network
          if (!merged[networkName].ipv4_address && base[networkName].ipv4_address) {
            merged[networkName].ipv4_address = base[networkName].ipv4_address;
          }
        }
      }

      // Ensure that networks that don't have user settings but exist in base are still included
      for (const key in user) {
        if (!(key in base)) {
          merged[key] = { ...user[key] }; // Add user networks that don't exist in base
        }
      }

      return merged;
    };

    // Normalize the merged networks to ensure types are correct and compatible with Compose
    const nextNetworks = Object.fromEntries(
      Object.entries(mergeNetworks(networks, userSetNetworks)).map(([key, config]) => [key, normalizeNetwork(config)])
    );

    // ##### <DEPRECATED> Kept for legacy compatibility
    const nextServiceVolumes = stringifyVolumeMappings(
      volumeMappings.map((vol): VolumeMapping => {
        const hostUserSet = vol.name && userSetLegacyBindVolumes[vol.name];
        return hostUserSet && path.isAbsolute(hostUserSet) ? { host: hostUserSet, container: vol.container } : vol;
      })
    );
    // ##### </DEPRECATED>

    const nextLabels = {
      ...(service.labels || {}),
      ...writeDefaultsToLabels(pick(service, ["environment", "ports", "volumes"]))
    };

    return {
      ...service,
      environment: nextEnvironment,
      ports: nextPorts,
      volumes: nextServiceVolumes,
      labels: nextLabels,
      networks: nextNetworks
    };
  });

  // Volume section edits
  // Apply general mountpoint to all volumes + specific mountpoints to named volumes
  const nextVolumes = mapValues(compose.volumes || {}, (vol, volumeName) => {
    const mountpoint = (userSettings.namedVolumeMountpoints || {})[volumeName] || userSettings.allNamedVolumeMountpoint;
    return mountpoint
      ? {
          driver_opts: {
            type: "none",
            device: getDevicePath({ mountpoint, dnpName, volumeName }),
            o: "bind"
          }
        }
      : vol;
  });

  // TODO: Handle networks in array format?
  const nextNetworks = {
    ...compose.networks,
    ...userSettings.networks?.rootNetworks
  };

  return cleanCompose({
    ...compose,
    services: nextServices,
    volumes: nextVolumes,
    networks: nextNetworks
  });
}

/**
 * Util: Get unique ID per unique port mapping
 * @param portMapping
 */
function getPortMappingId(portMapping: PortMapping): string {
  return `${portMapping.container}/${portMapping.protocol}`;
}

/**
 * Util: Checks if any compose service is using a specific volume by name
 * @param compose
 * @param volName
 */
function isComposeVolumeUsed(compose: Compose, volName: string): boolean {
  return Object.values(compose.services).some(
    (service) => service.volumes && service.volumes.some((vol) => vol.startsWith(volName))
  );
}
