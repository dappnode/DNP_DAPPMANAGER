import params from "../params";
import { HttpsPortalMapping, ExposableServiceMapping } from "../types";
import {
  HttpsPortal,
  HttpsPortalApiClient,
  getExposableServices
} from "../modules/https-portal";

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

/**
 * HTTPs Portal: get exposable services with metadata
 */
export async function httpsPortalExposableServicesGet(): Promise<
  ExposableServiceMapping[]
> {
  const exposable = await getExposableServices();
  const mappings = await httpsPortal.getMappings();
  const mappingsById = new Map(
    mappings.map(mapping => [getServiceId(mapping), mapping])
  );

  return exposable.map(mapping => {
    const exposedMapping = mappingsById.get(getServiceId(mapping));
    if (exposedMapping) {
      return { ...exposedMapping, ...mapping, exposed: true };
    } else {
      return { ...mapping, exposed: false };
    }
  });
}

/** Helper to uniquely identify mapping target services */
function getServiceId(
  mapping: Omit<HttpsPortalMapping, "fromSubdomain">
): string {
  return `${mapping.dnpName} ${mapping.serviceName} ${mapping.port}`;
}
