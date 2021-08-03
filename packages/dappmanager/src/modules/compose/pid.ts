import { InstallPackageData } from "../../types";

/**
 * Check if a package contains compose feature pid
 * in any of its services
 */
export function hasPid(pkg: InstallPackageData): boolean {
  for (const service of Object.values(pkg.compose.services)) {
    if (service.pid) return true;
  }
  return false;
}
