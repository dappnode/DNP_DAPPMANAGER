import { listPackages } from "../modules/docker/list";
import { InstalledPackageData } from "../types";

/**
 * Returns the list of current containers associated to packages
 */
export async function packagesGet(): Promise<InstalledPackageData[]> {
  return sortPackages(await listPackages());
}

/**
 * Sort packages by dnpName
 * Sort their containers by isMain first, then by serviceName
 */
export function sortPackages(
  dnps: InstalledPackageData[]
): InstalledPackageData[] {
  for (const dnp of dnps) {
    dnp.containers = dnp.containers.sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      return a.serviceName.localeCompare(b.serviceName);
    });
  }

  return dnps.sort((a, b) => a.dnpName.localeCompare(b.dnpName));
}
