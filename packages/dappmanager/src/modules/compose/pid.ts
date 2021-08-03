import { InstallPackageData, InstalledPackageData } from "../../types";
import { ComposeFileEditor } from "./editor";

/**
 * Check if a package that will be installed/updated
 * contains compose feature pid in any of its services
 */
export function packageToInstallHasPid(pkg: InstallPackageData): boolean {
  for (const service of Object.values(pkg.compose.services)) {
    if (service.pid) return true;
  }
  return false;
}

/**
 * Check if an installed package contains
 * compose feature pid in any of its services
 */
export function packageInstalledHasPid(pkg: InstalledPackageData): boolean {
  const composeEditor = new ComposeFileEditor(pkg.dnpName, pkg.isCore);
  const compose = composeEditor.compose;

  for (const service of Object.values(compose.services)) {
    if (service.pid) return true;
  }
  return false;
}
