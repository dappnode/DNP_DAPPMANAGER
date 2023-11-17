import { HttpsPortalMapping, PackageContainer } from "@dappnode/common";
import { httpsPortal } from "../httpsPortal.js";

/**
 * HTTPs Portal: get all mappings
 */
export async function httpsPortalMappingsGet({
  containers,
}: {
  containers?: PackageContainer[];
}): Promise<HttpsPortalMapping[]> {
  return await httpsPortal.getMappings(containers);
}
