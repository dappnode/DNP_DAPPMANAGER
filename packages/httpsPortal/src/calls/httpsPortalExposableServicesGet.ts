import { ExposableServiceMapping, HttpsPortalMapping } from "@dappnode/common";
import { httpsPortal } from "../httpsPortal.js";
import { getExposableServices } from "../exposable/index.js";

/**
 * HTTPs Portal: get exposable services with metadata
 */
export async function httpsPortalExposableServicesGet(): Promise<
  ExposableServiceMapping[]
> {
  const mappingsInfo = await getExposableServices();
  const mappings = await httpsPortal.getMappings();
  const mappingsById = new Map(
    mappings.map((mapping) => [getServiceId(mapping), mapping])
  );

  return mappingsInfo.map((mappingInfo) => {
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
