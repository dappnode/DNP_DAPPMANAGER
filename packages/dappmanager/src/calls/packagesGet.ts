import * as db from "../db";
import shouldUpdate from "../modules/dappGet/utils/shouldUpdate";
import { listPackages } from "../modules/docker/list";
import {
  InstalledPackageData,
  InstalledPackageDataApiReturn,
  UpdateAvailable
} from "@dappnode/common";

/**
 * Returns the list of current containers associated to packages
 */
export async function packagesGet(): Promise<InstalledPackageDataApiReturn[]> {
  const dnps = sortPackages(await listPackages());

  // Check if an update is available from stored last known version
  const latestKnownVersions = db.packageLatestKnownVersion.getAll();

  return dnps.map(dnp => {
    const latestKnownVersion: UpdateAvailable | undefined =
      latestKnownVersions[dnp.dnpName];
    return {
      ...dnp,
      updateAvailable:
        latestKnownVersion &&
        shouldUpdate(dnp.version, latestKnownVersion.newVersion)
          ? latestKnownVersion
          : null
    };
  });
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
