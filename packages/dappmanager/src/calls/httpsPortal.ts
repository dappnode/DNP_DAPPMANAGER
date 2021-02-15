import { HttpsPortal, HttpsPortalApiClient } from "../modules/https-portal";
import { HttpsPortalMapping } from "../types";
import params from "../params";

const httpsPortalApiClient = new HttpsPortalApiClient(
  params.HTTPS_PORTAL_API_URL
);

const httpsPortal = new HttpsPortal(httpsPortalApiClient);

/**
 * HTTPs Portal: map a subdomain
 */
export async function httpsPortalMappingAdd(
  mapping: HttpsPortalMapping
): Promise<void> {
  await httpsPortal.addMapping(mapping);
}

/**
 * HTTPs Portal: remove an existing mapping
 */
export async function httpsPortalMappingRemove(
  mapping: HttpsPortalMapping
): Promise<void> {
  await httpsPortal.removeMapping(mapping);
}

/**
 * HTTPs Portal: get all mappings
 */
export async function httpsPortalMappingsGet(): Promise<HttpsPortalMapping[]> {
  return await httpsPortal.getMappings();
}
