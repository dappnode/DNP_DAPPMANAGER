import { mapValues, omit, pick, isEmpty } from "lodash";
import {
  parseVolumeMappings,
  parseEnvironment,
  mergeEnvs,
  stringifyEnvironment
} from "../../../utils/dockerComposeParsers";
import params from "../../../params";
import {
  Manifest,
  PackageReleaseMetadata,
  ManifestWithImage,
  ComposeVolumes,
  ComposeUnsafe,
  Compose,
  ReleaseWarnings
} from "../../../types";
import { shortNameDomain } from "../../../utils/format";
import { setupWizard1To2 } from "./setupWizardParsers";

// Define docker compose parameters
const containerNamePrefix = params.CONTAINER_NAME_PREFIX;
const containerCoreNamePrefix = params.CONTAINER_CORE_NAME_PREFIX;

function getGlobalEnvsFilePath(isCore: boolean): string {
  return isCore ? params.GLOBAL_ENVS_PATH_CORE : params.GLOBAL_ENVS_PATH_DNP;
}

/**
 * Legacy function to convert a manifest into a compose
 * - It should exclusively accept the properties of a compose that are pre-screened
 * - It should let the docker-compose sanitation to the another function
 *
 * @param manifest
 */
export function manifestToCompose(manifest: ManifestWithImage): ComposeUnsafe {
  const { name, image } = manifest;
  const serviceName = name;
  const isCore = getIsCore(manifest);

  const volumes: ComposeVolumes = {};
  if (manifest.image.volumes)
    for (const vol of parseVolumeMappings(manifest.image.volumes))
      if (vol.name) volumes[vol.name] = {};
  if (manifest.image.external_vol)
    for (const vol of parseVolumeMappings(manifest.image.external_vol))
      if (vol.name)
        volumes[vol.name] = {
          external: {
            name: vol.name
          }
        };

  const serviceVolumes: string[] = [
    ...(image.volumes || []),
    ...(image.external_vol || [])
  ];

  /* eslint-disable @typescript-eslint/camelcase */
  return {
    version: "3.4",
    services: {
      [serviceName]: {
        ...pick(image, [
          "ports",
          "environment",
          "privileged",
          "restart",
          "cap_add",
          "cap_drop",
          "devices",
          "network_mode",
          "command"
        ]),
        ...(isEmpty(serviceVolumes) ? {} : { volumes: serviceVolumes }),
        ...(image.labels ? { labels: parseEnvironment(image.labels) } : {}),
        ...(isCore && image.ipv4_address
          ? {
              networks: {
                network: {
                  ipv4_address: image.ipv4_address
                }
              }
            }
          : {})
      }
    },

    // Volumes
    ...(isEmpty(volumes) ? {} : { volumes }),

    // Networks
    ...(isCore && image.subnet
      ? {
          networks: {
            [params.DNP_NETWORK_INTERNAL_NAME]: {
              driver: "bridge",
              ipam: {
                config: [{ subnet: image.subnet }]
              }
            }
          }
        }
      : {})
  };
  /* eslint-enable @typescript-eslint/camelcase */
}

/**
 * Sanitize metadata from the manifest.
 * Since metadata is not used for critical purposes, it can just
 * be copied over
 *
 * @param manifest
 */
export function parseMetadataFromManifest(
  manifest: Manifest
): PackageReleaseMetadata {
  const setupWizard = manifest.setupWizard
    ? manifest.setupWizard
    : manifest.setupSchema && manifest.setupTarget
    ? setupWizard1To2(
        manifest.setupSchema,
        manifest.setupTarget,
        manifest.setupUiJson || {}
      )
    : undefined;

  return {
    ...omit(manifest as ManifestWithImage, [
      "avatar",
      "image",
      "setupSchema",
      "setupTarget",
      "setupUiJson"
    ]),
    ...(setupWizard ? { setupWizard } : {}),
    // ##### Is this necessary? Correct manifest: type missing
    type: manifest.type || "service"
  };
}

/**
 * Strict sanitation of a docker-compose to prevent
 * - Use of uncontroled features
 * - Use of unsupported docker-compose syntax
 * [NOTE] Allow but dangerous usage is tolerated by this function
 * but will generate a warning in another function.
 *
 * @param composeUnsafe
 * @param manifest
 */
export function sanitizeCompose(
  composeUnsafe: ComposeUnsafe,
  manifest: Manifest,
  config: { domain: string }
): Compose {
  const serviceName = Object.keys(composeUnsafe.services)[0];
  const service = composeUnsafe.services[serviceName];
  const { name, version } = manifest;
  const isCore = getIsCore(manifest);

  /* eslint-disable @typescript-eslint/camelcase */
  const serviceFiltered = pick(service, [
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
    "labels"
  ]);

  // From networks
  if (!isCore) delete composeUnsafe.networks;

  const env_file = [];
  if ((manifest.globalEnvs || {}).all)
    env_file.push(getGlobalEnvsFilePath(isCore));

  // Add SSL environment variables
  if (manifest.ssl) {
    const dnpSubDomain = `${shortNameDomain(name)}.${config.domain}`;
    serviceFiltered.environment = stringifyEnvironment(
      mergeEnvs(parseEnvironment(serviceFiltered.environment || []), {
        VIRTUAL_HOST: dnpSubDomain,
        LETSENCRYPT_HOST: dnpSubDomain
      })
    );
  }

  const compose: Compose = {
    ...pick(composeUnsafe, ["version", "networks"]),
    services: {
      [name]: {
        ...serviceFiltered,
        container_name: getContainerName(name, isCore),
        image: getImage(name, version),
        restart: service.restart || "always",
        ...(env_file.length ? { env_file } : {}),
        // Add logging options to prevent huge log files
        logging: service.logging || {
          driver: "json-file",
          options: {
            "max-size": "10m",
            "max-file": "3"
          }
        }
      }
    }
  };

  // If there are volume declarations, only keep safe properties
  if (!isEmpty(composeUnsafe.volumes)) {
    compose.volumes = mapValues(composeUnsafe.volumes, vol =>
      pick(vol, ["external"])
    );
  }

  // #### TODO, sanitize network

  return compose;
  /* eslint-enable @typescript-eslint/camelcase */
}

/**
 * Generates an object of warnings so other components can
 * decide to throw an error or just show a warning in the UI
 *
 * @param release So it has access to all its assets
 */
export function getReleaseWarnings({
  name,
  isCore,
  origin
}: {
  name: string;
  isCore: boolean;
  origin?: string;
}): ReleaseWarnings {
  const releaseWarnings: ReleaseWarnings = {};

  if (isCore && origin && name.endsWith(".dnp.dappnode.eth"))
    releaseWarnings.unverifiedCore = true;

  return releaseWarnings;
}

// Minor utils

export function getIsCore(manifest: Manifest): boolean {
  return manifest.type === "dncore";
}

export function getContainerName(name: string, isCore: boolean): string {
  // Note: the prefixes already end with the character "-"
  return `${isCore ? containerCoreNamePrefix : containerNamePrefix}${name}`;
}

function getImage(name: string, version: string): string {
  return `${name}:${version}`;
}
