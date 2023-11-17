import { HttpsPortalMapping } from "@dappnode/common";
import { httpsPortal } from "../httpsPortal.js";

/**
 * HTTPs Portal: map a subdomain
 */
export async function httpsPortalMappingAdd({
  mapping,
}: {
  mapping: HttpsPortalMapping;
}): Promise<void> {
  await httpsPortal.addMapping(mapping);
}
