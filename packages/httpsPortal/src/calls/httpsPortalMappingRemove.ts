import { HttpsPortalMapping } from "@dappnode/common";
import { httpsPortal } from "../httpsPortal.js";

/**
 * HTTPs Portal: remove an existing mapping
 */
export async function httpsPortalMappingRemove({
  mapping,
}: {
  mapping: HttpsPortalMapping;
}): Promise<void> {
  await httpsPortal.removeMapping(mapping);
}
