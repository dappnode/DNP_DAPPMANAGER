import { HttpsPortalMapping, ExposableServiceMapping } from "@dappnode/types";
import { httpsPortal, getExposableServices } from "@dappnode/httpsportal";

/**
 * HTTPs Portal: map a subdomain
 */
export async function httpsPortalMappingAdd({
  mapping
}: {
  mapping: HttpsPortalMapping;
}): Promise<void> {
  await httpsPortal.addMapping(mapping);
}

/**
 * HTTPs Portal: remove an existing mapping
 */
export async function httpsPortalMappingRemove({
  mapping
}: {
  mapping: HttpsPortalMapping;
}): Promise<void> {
  await httpsPortal.removeMapping(mapping);
}

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
  const mappingsInfo = await getExposableServices();
  const mappings = await httpsPortal.getMappings();
  const mappingsById = new Map(
    mappings.map(mapping => [getServiceId(mapping), mapping])
  );

  return mappingsInfo.map(mappingInfo => {
    const exposedMapping = mappingsById.get(getServiceId(mappingInfo));
    if (exposedMapping) {
      return { ...mappingInfo, ...exposedMapping, exposed: true }; // override .fromSubdomain potentially
    } else {
      return { ...mappingInfo, exposed: false };
    }
  });
}

/** Helper to uniquely identify mapping target services */
function getServiceId(
  mapping: Omit<HttpsPortalMapping, "fromSubdomain">
): string {
  return `${mapping.dnpName}/${mapping.serviceName}/${mapping.port}`;
}
