import { InstalledPackageDataApiReturn } from "@dappnode/common";
import { packagesGet as pkgsGet } from "@dappnode/installer";

/**
 * Returns the list of current containers associated to packages
 */
export async function packagesGet(): Promise<InstalledPackageDataApiReturn[]> {
  return await pkgsGet();
}
