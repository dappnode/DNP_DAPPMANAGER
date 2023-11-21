import { Compose } from "@dappnode/common";

/**
 * Returns whether the given compose file is a mono-service compose file or not
 * @param compose Compose file
 * @returns True if the compose file is a mono-service compose file, false otherwise
 */
export function getIsMonoService(compose: Compose): boolean {
  return Object.keys(compose.services).length === 1;
}
