import { InstalledPackageDataApiReturn } from "@dappnode/types";
import { packagesGet as _packagesGet } from "@dappnode/installer";

/**
 * Returns the list of current containers associated to packages
 */
export async function packagesGet(): Promise<InstalledPackageDataApiReturn[]> {
  return await _packagesGet();
}
