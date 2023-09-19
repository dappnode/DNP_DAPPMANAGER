import { mapValues, toPairs, sortBy, fromPairs, pick } from "lodash-es";
import { getContainerName } from "@dappnode/utils";
import { params } from "@dappnode/params";
import { getIsCore } from "../manifest/getIsCore.js";
import { cleanCompose } from "./clean.js";
import { parseEnvironment } from "./environment.js";
import { parseServiceNetworks } from "./networks.js";
import { getPrivateNetworkAliases } from "../../domains.js";
import {
  Manifest,
  Compose,
  ComposeService,
  ComposeServiceNetworks,
  ComposeNetworks,
  dockerComposeSafeKeys,
  getImageTag
} from "@dappnode/types";
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
              "max-file": "3"
            }
          },
          restart: "unless-stopped",

          // SAFE KEYS: values that are whitelisted
          ...pick(
            serviceUnsafe,
            dockerComposeSafeKeys.filter(safeKey => safeKey !== "build")
          ),

          // MANDATORY VALUES: values that will be overwritten with dappnode defaults
          container_name: getContainerName({ dnpName, serviceName, isCore }),
          image: getImageTag({ serviceName, dnpName, version }),
          environment: parseEnvironment(serviceUnsafe.environment || {}),
          dns: params.DNS_SERVICE, // Common DAppNode ENS
          networks: setServiceNetworksWithAliases(serviceUnsafe.networks, {
            serviceName,
            dnpName,
            // The root pkg alias will be added to the main service or if it is a mono service
            isMain: isMonoService || manifest.mainService === serviceName
          })
        });
      }
    ),

    volumes: composeUnsafe.volumes || {},

    networks: setNetworks(composeUnsafe.networks)
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
  service: { serviceName: string; dnpName: string; isMain: boolean }
): ComposeServiceNetworks {
  // Return service network dncore_network with aliases if not provided
  if (!serviceNetworks)
    return {
      [params.DNP_PRIVATE_NETWORK_NAME]: {
        aliases: getPrivateNetworkAliases(service)
      }
    };

  // Return the service network dncore_network with the aliases added
  serviceNetworks = parseServiceNetworks(serviceNetworks);
  return {
    ...serviceNetworks,
    [params.DNP_PRIVATE_NETWORK_NAME]: {
      ...(serviceNetworks[params.DNP_PRIVATE_NETWORK_NAME] || {}),
      aliases: getPrivateNetworkAliases(service)
    }
  };
}

/**
 * Returns the network provided with the `external: true` added if not provided
 * If the network dncore_network is not provided, it will be added
 */
function setNetworks(
  networks: ComposeNetworks | undefined = {}
): ComposeNetworks {
  const dncoreNetwork = networks[params.DNP_PRIVATE_NETWORK_NAME];
  // Return network dncore_network with external: true if not provided
  if (!dncoreNetwork)
    return {
      ...networks,
      [params.DNP_PRIVATE_NETWORK_NAME]: {
        external: true
      }
    };

  // Return the network dncore_network with the external: true added
  if (!dncoreNetwork.external)
    return {
      ...networks,
      [params.DNP_PRIVATE_NETWORK_NAME]: {
        ...dncoreNetwork,
        external: true
      }
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

/**
 * Returns true if there is only one service in the compose file
 */
function getIsMonoService(compose: Compose): boolean {
  return Object.keys(compose.services).length === 1;
}
