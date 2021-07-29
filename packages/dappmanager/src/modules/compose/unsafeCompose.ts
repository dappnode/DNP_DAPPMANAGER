import {
  mapValues,
  pick,
  omit,
  toPairs,
  sortBy,
  fromPairs,
  uniq
} from "lodash";
import params, { getImageTag, getContainerName } from "../../params";
import { getIsCore } from "../manifest/getIsCore";
import { cleanCompose } from "./clean";
import { parseEnvironment } from "./environment";
import { parseServiceNetworks } from "./networks";
import { getPrivateNetworkAliases } from "../../domains";
import {
  Compose,
  ComposeService,
  ComposeServiceNetworks,
  ComposeVolumes,
  ComposeNetwork,
  ComposeNetworks,
  Manifest
} from "../../types";
import semver from "semver";

interface ValidationAlert {
  name: string;
  details: string;
  serviceName?: string;
}

const serviceSafeKeys: (keyof ComposeService)[] = [
  "cap_add",
  "cap_drop",
  "command",
  "devices",
  "entrypoint",
  "environment",
  "expose",
  "extra_hosts",
  "labels",
  "logging",
  "network_mode",
  "networks",
  "pid",
  "ports",
  "privileged",
  "restart",
  "stop_grace_period",
  "stop_signal",
  "user",
  "volumes",
  "working_dir"
];

// Disallow external volumes to prevent packages accessing sensitive data of others
const volumeSafeKeys: (keyof ComposeVolumes)[] = [];

// Disallow external network to prevent packages accessing un-wanted networks
const networkSafeKeys: (keyof ComposeNetwork)[] = [];

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
  // Use of new compose feature "name" only available in version 3.5
  // https://docs.docker.com/compose/compose-file/compose-file-v3/#name-1

  return cleanCompose({
    version: ensureMinimumComposeVersion(composeUnsafe.version),

    services: mapValues(
      composeUnsafe.services,
      (serviceUnsafe, serviceName) => {
        // Restrict the values of 'pid'. Other possible values are:
        // - 'host': Very dangerous, can manipulate the host
        // - 'container:<container_name>': Very dangerous con manipulate DAPPMANAGER and then the host
        if (serviceUnsafe.pid && !serviceUnsafe.pid.startsWith("service:")) {
          throw Error(`Only pid 'service:* is allowed: ${serviceUnsafe.pid}`);
        }

        return sortServiceKeys({
          // Overridable defaults
          restart: "unless-stopped",
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
          networks: parseUnsafeServiceNetworks(
            serviceUnsafe.networks,
            composeUnsafe.networks,
            isCore,
            {
              serviceName,
              dnpName,
              isMain: manifest.mainService === serviceName
            }
          )
        });
      }
    ),

    volumes: parseUnsafeVolumes(composeUnsafe.volumes),

    networks: parseUnsafeNetworks(composeUnsafe.networks, isCore)
  });
}

function ensureMinimumComposeVersion(composeFileVersion: string): string {
  if (
    semver.lt(composeFileVersion + ".0", params.MINIMUM_COMPOSE_VERSION + ".0")
  )
    composeFileVersion = params.MINIMUM_COMPOSE_VERSION;

  return composeFileVersion;
}

function parseUnsafeServiceNetworks(
  serviceNetworks: ComposeServiceNetworks | undefined,
  composeNetworks: ComposeNetworks | undefined = {},
  isCore: boolean,
  service: { serviceName: string; dnpName: string; isMain: boolean }
): ComposeServiceNetworks {
  // TODO: See note in parseUnsafeNetworks() about name property
  const isDncoreNetworkDeclared =
    composeNetworks[params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE];
  const dnpPrivateNetworkName =
    isCore && isDncoreNetworkDeclared
      ? params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE
      : params.DNP_PRIVATE_NETWORK_NAME;

  const networksObj = parseServiceNetworks(serviceNetworks || {});

  // Only allow customizing config for core packages
  const dnpPrivateNetwork = isCore
    ? networksObj[dnpPrivateNetworkName] || {}
    : {};

  return {
    ...networksObj,
    [dnpPrivateNetworkName]: {
      ...dnpPrivateNetwork,
      aliases: uniq([
        ...(dnpPrivateNetwork.aliases || []),
        ...getPrivateNetworkAliases(service)
      ])
    }
  };
}

function parseUnsafeNetworks(
  networks: ComposeNetworks | undefined = {},
  isCore: boolean
): ComposeNetworks {
  // Allow the dncore network config to be customized, but only by isCore DNPs
  const {
    [params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE]: dncoreNetwork,
    ...otherNetworks
  } = networks;

  // Remove unsafe keys from all other networks
  networks = mapValues(otherNetworks, net => pick(net, networkSafeKeys));

  if (isCore && dncoreNetwork) {
    networks[params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE] = dncoreNetwork;
  } else {
    networks[params.DNP_PRIVATE_NETWORK_NAME] = { external: true };
  }

  return networks;
}

function parseUnsafeVolumes(
  volumes: ComposeVolumes | undefined
): ComposeVolumes | undefined {
  if (!volumes) return undefined;

  // External volumes are not allowed
  for (const [volName, vol] of Object.entries(volumes)) {
    if (vol && vol.external)
      throw Error(`External volumes are not allowed '${volName}'`);
  }

  return mapValues(volumes, vol => pick(vol, volumeSafeKeys));
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
