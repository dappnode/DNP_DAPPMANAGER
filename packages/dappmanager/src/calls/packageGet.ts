import { InstalledPackageDetailData } from "@dappnode/common";
import { packageGet as _packageGet } from "@dappnode/installer";

/**
 * Get package detail information
 */
export async function packageGet({
  dnpName
}: {
  dnpName: string;
}): Promise<InstalledPackageDetailData> {
  return await _packageGet({ dnpName });
}
