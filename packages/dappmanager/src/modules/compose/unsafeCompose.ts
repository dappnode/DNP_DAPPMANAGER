import { mapValues, pick, omit } from "lodash";
import params from "../../params";
import { getIsCore } from "../manifest/getIsCore";
import { cleanCompose } from "./clean";
import { parseEnvironment } from "./environment";
import { Compose, ComposeService, ComposeVolumes, Manifest } from "../../types";

interface ValidationAlert {
  name: string;
  details: string;
  serviceName?: string;
}

const serviceSafeKeys: (keyof ComposeService)[] = [
  // Required properties
  "container_name",
  "image",
  // Mergable properties (editable)
  "volumes",
  "ports",
  "environment",
  // Non-mergable properties
  "restart",
  "privileged",
  "cap_add",
  "cap_drop",
  "devices",
  "network_mode",
  "networks",
  "command",
  "labels",
  "logging"
];
const volumeSafeKeys: (keyof ComposeVolumes)[] = ["external"];

// Note: the prefixes already end with the character "-"
export const getContainerName = (name: string, isCore: boolean): string =>
  (isCore ? params.CONTAINER_CORE_NAME_PREFIX : params.CONTAINER_NAME_PREFIX) +
  name;

export const getImage = (name: string, version: string): string =>
  `${name}:${version}`;

/**
 * Strict sanitation of a docker-compose to prevent
 * - Use of uncontroled features
 * - Use of unsupported docker-compose syntax
 * [NOTE] Allow but dangerous usage is tolerated by this function
 * but will generate a warning in another function.
 */
export function parseUnsafeCompose(
  composeUnsafe: Compose,
  manifest: Manifest
): Compose {
  const { name, version } = manifest;
  const isCore = getIsCore(manifest);

  return cleanCompose({
    version: composeUnsafe.version || "3.4",

    services: mapValues(composeUnsafe.services, serviceUnsafe => ({
      // Overridable defaults
      restart: "always",
      logging: {
        driver: "json-file",
        options: {
          "max-size": "10m",
          "max-file": "3"
        }
      },

      // Whitelisted optional keys
      ...pick(serviceUnsafe, serviceSafeKeys),

      // Mandatory values
      container_name: getContainerName(name, isCore),
      image: getImage(name, version),
      environment: parseEnvironment(serviceUnsafe.environment || {}),
      dns: params.DNS_SERVICE, // Common DAppNode ENS
      networks: isCore
        ? serviceUnsafe.networks || [params.DNP_NETWORK_EXTERNAL_NAME]
        : [params.DNP_NETWORK_EXTERNAL_NAME]
    })),

    volumes: mapValues(composeUnsafe.volumes || {}, vol =>
      pick(vol, volumeSafeKeys)
    ),

    networks: isCore
      ? composeUnsafe.networks || {
          [params.DNP_NETWORK_INTERNAL_NAME]: {
            driver: "bridge",
            ipam: { config: [{ subnet: "172.33.0.0/16" }] }
          }
        }
      : {
          [params.DNP_NETWORK_EXTERNAL_NAME]: { external: true }
        }
  });
}

/**
 * Reverse of parseUnsafeCompose, returns alerts for each invalid field that has
 * been overwritten or ignored. For development to show developers what properties
 * will be ignored in the user's DAppNodes
 */
export function unsafeComposeAlerts(
  composeUnsafe: Compose,
  metadata: { name: string; version: string; isCore: boolean }
): ValidationAlert[] {
  const alerts: ValidationAlert[] = [];

  const { isCore, name, version } = metadata;

  for (const serviceName in composeUnsafe.services) {
    const service = composeUnsafe.services[serviceName];

    // Alert of ignored keys
    const ignoredObj = omit(service, serviceSafeKeys);
    for (const ignoredKey in ignoredObj)
      alerts.push({
        name: "Ignored compose service value",
        details: `Compose value services["${serviceName}"].${ignoredKey} is ignored`,
        serviceName
      });

    if (!isCore && service.networks)
      alerts.push({
        name: "Ignored compose service network",
        details: "Only core packages can specify custom network settings",
        serviceName
      });

    const image = getImage(name, version);
    if (image !== service.image)
      alerts.push({
        name: "Invalid image",
        details: `Service ${serviceName} image is ${service.image} instead of ${image}`,
        serviceName
      });
  }

  if (composeUnsafe.volumes)
    for (const volName in composeUnsafe.volumes) {
      const vol = composeUnsafe.volumes[volName];

      // Alert of ignored keys
      const ignoredObj = omit(vol, volumeSafeKeys);
      for (const ignoredKey in ignoredObj)
        alerts.push({
          name: "Ignored compose volume value",
          details: `Compose value volumes["${volName}"].${ignoredKey} is ignored`
        });
    }

  if (!isCore) {
    if (composeUnsafe.networks)
      alerts.push({
        name: "Ignored compose network",
        details: "Only core packages can specify custom network settings"
      });
  }

  return alerts;
}
