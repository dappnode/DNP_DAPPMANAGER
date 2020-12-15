import { listPackages } from "../modules/docker/list";
import { InstalledPackageData } from "../types";

/**
 * Returns the list of current containers associated to packages
 */
export async function packagesGet(): Promise<InstalledPackageData[]> {
  return await listPackages();
}
