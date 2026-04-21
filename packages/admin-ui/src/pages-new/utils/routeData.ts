import { withLegacyBase } from "utils/path";

/**
 * Get the installer path for a given DAppNode package name.
 */
export const getInstallerPath = (dnpName: string) => {
  if (dnpName.includes("public")) return withLegacyBase("installer/public");
  return withLegacyBase("installer/dnp");
};
