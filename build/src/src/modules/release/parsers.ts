import { omit, pick, isEmpty } from "lodash";
import {
  parseVolumeMappings,
  parseEnvironment
} from "../../utils/dockerComposeParsers";
import params from "../../params";
import {
  Manifest,
  PackageReleaseMetadata,
  ManifestWithImage,
  ComposeVolumes,
  ComposeUnsafe,
  Compose
} from "../../types";

// Define docker compose parameters
const containerNamePrefix = params.CONTAINER_NAME_PREFIX;
const containerCoreNamePrefix = params.CONTAINER_CORE_NAME_PREFIX;

function getGlobalEnvsFilePath(isCore: boolean): string {
  return isCore ? params.GLOBAL_ENVS_PATH_CORE : params.GLOBAL_ENVS_PATH_DNP;
}

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

export function parseMetadataFromManifest(
  manifest: Manifest
): PackageReleaseMetadata {
  return {
    ...omit(manifest as ManifestWithImage, ["avatar", "image"]),
    // ##### Is this necessary? Correct manifest: type missing
    type: manifest.type || "service"
  };
}

export function sanitizeCompose(
  composeUnsafe: ComposeUnsafe,
  manifest: Manifest
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

  return {
    ...pick(composeUnsafe, ["version", "networks", "volumes"]),
    services: {
      [name]: {
        ...serviceFiltered,
        container_name: getContainerName(name, isCore),
        image: getImage(name, version),
        restart: service.restart || "always",
        ...(env_file.length ? { env_file } : {}),
        logging: {
          options: {
            "max-size": "10m",
            "max-file": "3"
          }
        }
      }
    }
  };
  /* eslint-enable @typescript-eslint/camelcase */
}

// Minor utils

export function getIsCore(manifest: Manifest): boolean {
  return manifest.type === "dncore";
}

function getContainerName(name: string, isCore: boolean): string {
  // Note: the prefixes already end with the character "-"
  return `${isCore ? containerCoreNamePrefix : containerNamePrefix}${name}`;
}

function getImage(name: string, version: string): string {
  return `${name}:${version}`;
}
