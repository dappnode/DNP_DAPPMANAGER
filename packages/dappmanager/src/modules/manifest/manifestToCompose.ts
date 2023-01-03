import { pick } from "lodash-es";
import { parseVolumeMappings } from "../compose/volumes";
import { parseEnvironment } from "../compose/environment";
import params, { getContainerName, getImageTag } from "../../params";
import { ManifestWithImage } from "../../types";
import { Compose, ComposeVolumes } from "@dappnode/dappnodesdk";
import { getIsCore } from "./getIsCore";
import { cleanCompose } from "../compose/clean";

/**
 * Legacy function to convert a manifest into a compose
 * - It should exclusively accept the properties of a compose that are pre-screened
 * - It should let the docker-compose sanitation to the another function
 *
 * @param manifest
 */
export function manifestToCompose(manifest: ManifestWithImage): Compose {
  const dnpName = manifest.name;
  const version = manifest.version;
  const isCore = getIsCore(manifest);
  const serviceName = dnpName;
  const image = manifest.image;

  const volumes: ComposeVolumes = {};
  if (image.volumes)
    for (const vol of parseVolumeMappings(image.volumes))
      if (vol.name) volumes[vol.name] = {};

  // FORBID, DEPRECATED features
  if (image.external_vol) {
    throw Error("External volumes are not allowed");
  }

  // Clean undefined and empty values
  // Using ternary operators and undefined to avoid using if statements
  // and have a clearer docker-compose looking syntax
  return cleanCompose({
    version: "3.5",
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
        container_name: getContainerName({ dnpName, serviceName, isCore }),
        image: getImageTag({ serviceName, dnpName, version }),
        environment: parseEnvironment(image.environment || {}),
        volumes: image.volumes,
        labels: parseEnvironment(image.labels || {}),
        networks:
          isCore && image.ipv4_address
            ? {
                [params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE]: {
                  ipv4_address: image.ipv4_address
                }
              }
            : undefined
      }
    },

    volumes,

    networks: isCore
      ? {
          [params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE]: {
            driver: "bridge",
            ipam: {
              config: [{ subnet: image.subnet || "172.33.0.0/16" }]
            }
          }
        }
      : undefined
  });
}
