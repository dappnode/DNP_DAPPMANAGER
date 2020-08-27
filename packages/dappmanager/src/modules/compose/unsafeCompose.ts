import { mapValues, pick, omit, toPairs, sortBy, fromPairs } from "lodash";
import params, { getImageTag, getContainerName } from "../../params";
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
  "volumes",
  "ports",
  "environment",
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

/**
 * Strict sanitation of a docker-compose to prevent
 * - Use of uncontroled features
 * - Use of unsupported docker-compose syntax
 * [NOTE] Allow but dangerous usage is tolerated by this function
 * but will generate a warning in unsafeComposeAlerts.
 */
export function parseUnsafeCompose(
  composeUnsafe: Compose,
  manifest: Manifest
): Compose {
  const dnpName = manifest.name;
  const version = manifest.version;
  const isCore = getIsCore(manifest);

  return cleanCompose({
    version: composeUnsafe.version || "3.4",

    services: mapValues(composeUnsafe.services, (serviceUnsafe, serviceName) =>
      sortServiceKeys({
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
        container_name: getContainerName({ dnpName, serviceName, isCore }),
        image: getImageTag({ serviceName, dnpName, version }),
        environment: parseEnvironment(serviceUnsafe.environment || {}),
        dns: params.DNS_SERVICE, // Common DAppNode ENS
        networks: isCore
          ? serviceUnsafe.networks || [params.DNP_NETWORK_EXTERNAL_NAME]
          : [params.DNP_NETWORK_EXTERNAL_NAME]
      })
    ),

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
 * Sort service keys alphabetically, for better readibility
 * @param service
 */
function sortServiceKeys(service: ComposeService): ComposeService {
  return fromPairs(sortBy(toPairs(service), "0")) as ComposeService;
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

  const dnpName = metadata.name;
  const version = metadata.version;
  const isCore = metadata.isCore;

  for (const [serviceName, service] of Object.entries(composeUnsafe.services)) {
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

    const imageTag = getImageTag({ serviceName, dnpName, version });
    if (imageTag !== service.image)
      alerts.push({
        name: "Invalid image",
        details: `Service ${serviceName} image is ${service.image} instead of ${imageTag}`,
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
