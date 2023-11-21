import { Compose } from "@dappnode/common";

/**
 * Check if a compose contains pid
 */
export function packageInstalledHasPid(compose: Compose): boolean {
  for (const service of Object.values(compose.services)) {
    if (service.pid) return true;
  }
  return false;
}
