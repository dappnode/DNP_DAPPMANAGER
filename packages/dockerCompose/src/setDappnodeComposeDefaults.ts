import { mapValues, toPairs, sortBy, fromPairs, pick } from "lodash-es";
import {
  getContainerName,
  getPrivateNetworkAliases,
  getIsCore,
  parseEnvironment,
  getImageTag,
  getIsMonoService,
} from "@dappnode/utils";
import { params } from "@dappnode/params";
import { cleanCompose } from "./clean.js";
import { parseServiceNetworks } from "./networks.js";
import {
  Manifest,
  Compose,
  ComposeService,
  ComposeServiceNetworks,
  ComposeNetworks,
  dockerComposeSafeKeys,
} from "@dappnode/common";
import { lt } from "semver";

/**
 * Returns the compose file for the given manifest
 */
export function setDappnodeComposeDefaults(
  composeUnsafe: Compose,
  manifest: Manifest
): Compose {
  const dnpName = manifest.name;
  const version = manifest.version;
  const isCore = getIsCore(manifest);
  const isMonoService = getIsMonoService(composeUnsafe);

  return cleanCompose({
    version: ensureMinimumComposeVersion(composeUnsafe.version),

    services: mapValues(
      composeUnsafe.services,
      (serviceUnsafe, serviceName) => {
        return sortServiceKeys({
          // OVERRIDABLE VALUES: values that in case of not been set, it will take the following values
          logging: {
            driver: "json-file",
            options: {
              "max-size": "10m",
              "max-file": "3",
            },
          },
          restart: "unless-stopped",

          // SAFE KEYS: values that are whitelisted
          ...pick(
            serviceUnsafe,
            dockerComposeSafeKeys.filter((safeKey) => safeKey !== "build")
          ),

          // MANDATORY VALUES: values that will be overwritten with dappnode defaults
          container_name: getContainerName({ dnpName, serviceName, isCore }),
          image: getImageTag({ serviceName, dnpName, version }),
          environment: parseEnvironment(serviceUnsafe.environment || {}),
          // Overrides any DNS provided to use the default Docker DNS server
          // Since Core v0.2.82, the bind package is not used anymore as DNS server for the containers
          dns: undefined,
          networks: setServiceNetworksWithAliases(serviceUnsafe.networks, {
            serviceName,
            dnpName,
            // The root pkg alias will be added to the main service or if it is a mono service
            isMainOrMonoservice:
              isMonoService || manifest.mainService === serviceName,
          }),
        });
      }
    ),

    volumes: composeUnsafe.volumes || {},

    networks: setNetworks(composeUnsafe.networks),
  });
}

/**
 * TEMPORARY: Ensure the compose version is at least 3.5. This will be eventually removed
 * and the SDK will not allow to build packages with older compose version than 3.5.
 * See https://github.com/dappnode/DAppNodeSDK/issues/241
 *
 * Use of new compose feature "name" only available in version 3.5
 * https://docs.docker.com/compose/compose-file/compose-file-v3/#name-1
 */
function ensureMinimumComposeVersion(composeFileVersion: string): string {
  if (lt(composeFileVersion + ".0", params.MINIMUM_COMPOSE_VERSION + ".0"))
    composeFileVersion = params.MINIMUM_COMPOSE_VERSION;

  return composeFileVersion;
}

/**
 * Returns the service network provided with the aliases added to the dncore_network
 * If the service network dncore_network is not provided, it will be added
 */
function setServiceNetworksWithAliases(
  serviceNetworks: ComposeServiceNetworks | undefined,
  service: {
    serviceName: string;
    dnpName: string;
    isMainOrMonoservice: boolean;
  }
): ComposeServiceNetworks {
  // Return service network dncore_network with aliases if not provided
  if (!serviceNetworks)
    return {
      [params.DOCKER_PRIVATE_NETWORK_NAME]: {
        aliases: getPrivateNetworkAliases(service),
      },
    };

  // Return the service network dncore_network with the aliases added
  serviceNetworks = parseServiceNetworks(serviceNetworks);
  const ip = serviceNetworks[params.DOCKER_PRIVATE_NETWORK_NAME].ipv4_address;
  return {
    ...serviceNetworks,
    [params.DOCKER_PRIVATE_NETWORK_NAME]: {
      ...(serviceNetworks[params.DOCKER_PRIVATE_NETWORK_NAME] || {}),
      aliases: getPrivateNetworkAliases(service),
      ipv4_address:
        service.dnpName === params.bindDnpName ? params.BIND_IP : undefined,
    },
  };
}

/**
 * Returns the network provided with the `external: true` added if not provided
 * If the network dncore_network is not provided, it will be added
 */
function setNetworks(
  networks: ComposeNetworks | undefined = {}
): ComposeNetworks {
  const dncoreNetwork = networks[params.DOCKER_PRIVATE_NETWORK_NAME];
  // Return network dncore_network with external: true if not provided
  if (!dncoreNetwork)
    return {
      ...networks,
      [params.DOCKER_PRIVATE_NETWORK_NAME]: {
        external: true,
      },
    };

  // Return the network dncore_network with the external: true added
  if (!dncoreNetwork.external)
    return {
      ...networks,
      [params.DOCKER_PRIVATE_NETWORK_NAME]: {
        ...dncoreNetwork,
        external: true,
      },
    };

  return networks;
}

/**
 * Sort service keys alphabetically, for better readibility
 * @param service
 */
function sortServiceKeys(service: ComposeService): ComposeService {
  return fromPairs(sortBy(toPairs(service), "0")) as ComposeService;
}
