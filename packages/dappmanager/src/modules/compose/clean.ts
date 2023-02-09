import { mapValues, omitBy, isObject, isEmpty, pick } from "lodash-es";
import { Compose } from "@dappnode/dappnodesdk";

/**
 * Cleans empty or null properties
 * Critical step to prevent writing faulty docker-compose.yml files
 * that can kill docker-compose calls.
 * - Removes service first levels keys that are objects or arrays and
 *   are empty (environment, env_files, ports, volumes)
 * @param compose
 */
export function cleanCompose(compose: Compose): Compose {
  return {
    version: compose.version,
    ...omitBy(compose, isOmitable),
    services: mapValues(compose.services, service => ({
      ...omitBy(service, isOmitable),
      // Add mandatory properties for the ts compiler
      ...pick(service, ["container_name", "image"])
    }))
  };
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function isOmitable(value: any): boolean {
  return (
    value === undefined || value === null || (isObject(value) && isEmpty(value))
  );
}
