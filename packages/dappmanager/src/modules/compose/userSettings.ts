import path from "path";
import { mapValues, pick, isEmpty, omitBy } from "lodash";
import {
  parsePortMappings,
  stringifyPortMappings,
  parseEnvironment,
  parseVolumeMappings,
  parseDevicePathMountpoint,
  getDevicePath
} from "./index";
import {
  PortMapping,
  Compose,
  UserSettings,
  UserSettingsAllDnps
} from "../../types";
import { cleanCompose } from "./clean";
import { stringifyVolumeMappings } from "./volumes";
import { readDefaultsFromLabels, writeDefaultsToLabels } from "./labelsDb";

/**
 * To be backwards compatible with older versions that do not store
 * default volumes. Only DNP with a customizable path was bitcoin
 * Custom volumes array example:
 * volumes = ["/dev0/user-set-path:/usr/data"]
 */
const legacyDefaultVolumes: { [dnpName: string]: string[] } = {
  "bitcoin.dnp.dappnode.eth": ["bitcoin_data:/root/.bitcoin"]
};

/**
 * Returns the user settings applied to this compose
 * This function works in coordination with other parsers to
 * correctly store and differentiate which settings are from the
 * user and which are not
 */
export function parseUserSettings(compose: Compose): UserSettingsAllDnps {
  return mapValues(
    compose.services,
    (service, serviceName): UserSettings => {
      const environment = parseEnvironment(service.environment || []);

      const portMappings: UserSettings["portMappings"] = {};
      for (const port of parsePortMappings(service.ports || []))
        portMappings[getPortMappingId(port)] = String(port.host || "");

      // Non-assigned mountpoints must be added in user settings so it
      // can be modified by the user in the UI. If it's value is "", it will be ignored
      // [NOTE]: Ignores volume declarations that are not used in the service
      const volumes = parseVolumeMappings(service.volumes || []);
      const namedVolumeMountpoints: UserSettings["namedVolumeMountpoints"] = {};
      if (compose.volumes)
        for (const [volumeName, volObj] of Object.entries(compose.volumes))
          if (volumes.find(vol => vol.name === volumeName) && !volObj.external)
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
      const defaults = readDefaultsFromLabels(service.labels || {});
      const parsedDefaultVolumes = parseVolumeMappings(
        defaults.volumes || legacyDefaultVolumes[serviceName] || []
      );
      const legacyBindVolumes: UserSettings["legacyBindVolumes"] = {};
      for (const { container, name } of parsedDefaultVolumes)
        if (name) {
          const vol = volumes.find(v => v.container === container);
          if (vol && vol.host !== name) legacyBindVolumes[name] = vol.host;
        }
      // ##### </DEPRECATED>

      // Ignore objects that are empty to make tests and payloads cleaner
      return omitBy(
        {
          environment,
          portMappings,
          namedVolumeMountpoints,
          legacyBindVolumes
        },
        isEmpty
      );
    }
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
  userSettingsServices: UserSettingsAllDnps,
  options?: { skipLabels: boolean }
): Compose {
  for (const serviceName in userSettingsServices) {
    const userSettings = userSettingsServices[serviceName];
    const service = compose.services[serviceName];
    if (service) {
      // Load envs, ports, and volumes
      const environment = parseEnvironment(service.environment || {});
      const portMappings = parsePortMappings(service.ports || []);
      const volumeMappings = parseVolumeMappings(service.volumes || []);

      // User set
      const userSetEnvironment = userSettings.environment || {};
      const userSetPortMappings = userSettings.portMappings || {};

      // New values
      const nextEnvironment = mapValues(
        environment,
        (envValue, envName) => userSetEnvironment[envName] || envValue
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

      // Volume section edits
      // Apply general mountpoint to all volumes + specific mountpoints to named volumes
      const dnpName = serviceName;
      if (compose.volumes)
        compose.volumes = mapValues(compose.volumes, (vol, volumeName) => {
          const mountpoint =
            (userSettings.namedVolumeMountpoints || {})[volumeName] ||
            userSettings.allNamedVolumeMountpoint;
          if (mountpoint && !vol.external)
            return {
              driver_opts: {
                type: "none",
                device: getDevicePath({ mountpoint, dnpName, volumeName }),
                o: "bind"
              }
            };
          else return vol;
        });

      // ##### <DEPRECATED> Kept for legacy compatibility
      const nextServiceVolumes = stringifyVolumeMappings(
        volumeMappings.map(vol => {
          const hostUserSet =
            vol.name && (userSettings.legacyBindVolumes || {})[vol.name];
          if (hostUserSet && path.isAbsolute(hostUserSet))
            return { host: hostUserSet, container: vol.container };
          else return vol;
        })
      );
      // ##### </DEPRECATED>

      const labels = {
        ...service.labels,
        ...writeDefaultsToLabels(
          pick(service, ["environment", "ports", "volumes"])
        )
      };

      compose.services[serviceName] = {
        ...service,
        environment: nextEnvironment,
        ports: nextPorts,
        volumes: nextServiceVolumes,
        labels: options && options.skipLabels ? undefined : labels
      };
    }
  }

  return cleanCompose(compose);
}

/**
 * Util: Get unique ID per unique port mapping
 * @param portMapping
 */
function getPortMappingId(portMapping: PortMapping): string {
  return `${portMapping.container}/${portMapping.protocol}`;
}
