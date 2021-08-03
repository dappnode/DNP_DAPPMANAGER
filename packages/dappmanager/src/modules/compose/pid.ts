import { InstallPackageData } from "../../types";

/**
 * Check if a package contains compose feature pid
 * in any of its services
 */
export function hasPid(pkg: InstallPackageData): boolean {
  const composeServices = Object.keys(pkg.compose.services);

  if (composeServices.length === 1) {
    // Monoservice package
    return pkg.compose.services[pkg.dnpName].pid ? true : false;
  } else if (composeServices.length > 1) {
    // Multiservice package
    for (const composeService of composeServices) {
      if (pkg.compose.services[composeService].pid) return true;
    }
    return false;
  }
  // Unexpected number of services
  else throw Error(`Unexpected number of services: ${composeServices.length}`);
}
