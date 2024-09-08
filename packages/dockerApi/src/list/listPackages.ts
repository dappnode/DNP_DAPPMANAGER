import { InstalledPackageData } from "@dappnode/types";
import { listPackageContainers } from "./listContainers.js";
import { groupPackagesFromContainers } from "./parsePackageFromContainer.js";

/**
 * Return containers grouped by parent package. Necessary for multi-service packages
 */
export async function listPackages(): Promise<InstalledPackageData[]> {
  const containers = await listPackageContainers();
  return groupPackagesFromContainers(containers);
}

export async function listPackageNoThrow({ dnpName }: { dnpName: string }): Promise<InstalledPackageData | null> {
  if (!dnpName) return null;

  // Optimize call are request only containers mapping to this package
  // Assumes containerName includes dnpName
  const containers = await listPackageContainers({ containerName: dnpName });
  const dnps = groupPackagesFromContainers(containers);

  return dnps.find((d) => d.dnpName === dnpName) || null;
}

export async function listPackage({ dnpName }: { dnpName: string }): Promise<InstalledPackageData> {
  const dnp = await listPackageNoThrow({ dnpName });
  if (!dnp) throw Error(`No DNP was found for name ${dnpName}`);
  return dnp;
}
