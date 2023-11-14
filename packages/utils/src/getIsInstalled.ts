import { InstalledPackageData } from "@dappnode/common";

/**
 * Helper to check if a package is installed
 */
export function getIsInstalled(
  { dnpName }: { dnpName: string },
  dnpList: InstalledPackageData[]
): boolean {
  return !!dnpList.find((dnp) => dnp.dnpName === dnpName);
}
