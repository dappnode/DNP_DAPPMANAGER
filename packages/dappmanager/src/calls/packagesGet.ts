import { listContainers } from "../modules/docker/listContainers";
import { InstalledPackageData } from "../types";

/**
 * Returns the list of current containers associated to packages
 */
export async function packagesGet(): Promise<InstalledPackageData[]> {
  return await listContainers();
}
