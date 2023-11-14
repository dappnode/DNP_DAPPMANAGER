import { InstalledPackageData } from "@dappnode/common";
import { shouldUpdate } from "./shouldUpdate.js";

/**
 * Helper to check if a package is update to the latest version
 */
export function getIsUpdated(
  { dnpName, reqVersion }: { dnpName: string; reqVersion: string },
  dnpList: InstalledPackageData[]
): boolean {
  const dnp = dnpList.find((dnp) => dnp.dnpName === dnpName);
  if (!dnp) return false;
  return !shouldUpdate(dnp.version, reqVersion);
}
