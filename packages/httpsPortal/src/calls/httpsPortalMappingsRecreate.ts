import { httpsPortal } from "../httpsPortal.js";

/**
 * HTTPs Portal: recreate HTTPs portal mapping
 */
export async function httpsPortalMappingsRecreate(): Promise<void> {
  const mappings = await httpsPortal.getMappings();

  for (const mapping of mappings) {
    await httpsPortal.removeMapping(mapping);
    await httpsPortal.addMapping(mapping);
  }
}
