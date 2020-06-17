import { pick } from "lodash";
import { parseVolumeMappings } from "../compose/volumes";
import { parseEnvironment } from "../compose/environment";
import params from "../../params";
import { ComposeVolumes, Compose, ManifestWithImage } from "../../types";
import { getIsCore } from "./getIsCore";
import { cleanCompose } from "../compose/clean";
import { getContainerName, getImage } from "../compose/unsafeCompose";

/**
 * Legacy function to convert a manifest into a compose
 * - It should exclusively accept the properties of a compose that are pre-screened
 * - It should let the docker-compose sanitation to the another function
 *
 * @param manifest
 */
export function manifestToCompose(manifest: ManifestWithImage): Compose {
  const { name, version, image } = manifest;
  const serviceName = name;
  const isCore = getIsCore(manifest);

  const volumes: ComposeVolumes = {};
  if (image.volumes)
    for (const vol of parseVolumeMappings(image.volumes))
      if (vol.name) volumes[vol.name] = {};
  if (image.external_vol)
    for (const vol of parseVolumeMappings(image.external_vol))
      if (vol.name) volumes[vol.name] = { external: { name: vol.name } };

  // Clean undefined and empty values
  // Using ternary operators and undefined to avoid using if statements
  // and have a clearer docker-compose looking syntax
  return cleanCompose({
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
        container_name: getContainerName(name, isCore),
        image: getImage(name, version),
        environment: parseEnvironment(image.environment || {}),
        volumes: [...(image.volumes || []), ...(image.external_vol || [])],
        labels: parseEnvironment(image.labels || {}),
        networks:
          isCore && image.ipv4_address
            ? {
                [params.DNP_NETWORK_INTERNAL_NAME]: {
                  ipv4_address: image.ipv4_address
                }
              }
            : undefined
      }
    },

    volumes,

    networks: isCore
      ? {
          [params.DNP_NETWORK_INTERNAL_NAME]: {
            driver: "bridge",
            ipam: {
              config: [{ subnet: image.subnet || "172.33.0.0/16" }]
            }
          }
        }
      : undefined
  });
}
