import params from "../params";
import { ComposeFileEditor } from "../modules/compose/editor";
import {
  HttpsPortalMapping,
  ExposableServiceMapping,
  HttpsLocalProxyingStatus
} from "../types";
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

/**
 * HTTPs Portal: set env value LOCAL_PROXYING
 * - LOCAL_PROXYING defines in the https to expose or not port 80 to my.dappnode.local (avahi).
 * - Allows/restricts access to the UI
 * - HTTPs PR: https://github.com/dappnode/DNP_HTTPS/pull/51
 */
export async function httpsLocalProxyingEnableDisable(
  enable: HttpsLocalProxyingStatus
): Promise<void> {
  await httpsPortal.localProxyingEnableDisable(enable);
}

/** HTTPs Portal: get env value LOCAL_PROXYING */
export async function httpsLocalProxyingGet(): Promise<
  HttpsLocalProxyingStatus
> {
  const composeHttps = new ComposeFileEditor(params.HTTPS_PORTAL_DNPNAME, true);
  const httpsService = composeHttps.services()[params.HTTPS_PORTAL_DNPNAME];
  const httpsEnv = httpsService.getEnvs();
  if (httpsEnv[params.HTTPS_PORTAL_LOCAL_PROXYING_ENVNAME] === undefined)
    throw Error(
      `${params.HTTPS_PORTAL_LOCAL_PROXYING_ENVNAME} does not exist on compose file`
    );
  const localProxying = httpsEnv[params.HTTPS_PORTAL_LOCAL_PROXYING_ENVNAME];
  if (localProxying !== "true" && localProxying !== "false")
    throw Error(
      `Invalid value of ${params.HTTPS_PORTAL_LOCAL_PROXYING_ENVNAME}`
    );
  return localProxying;
}

/** Helper to uniquely identify mapping target services */
function getServiceId(
  mapping: Omit<HttpsPortalMapping, "fromSubdomain">
): string {
  return `${mapping.dnpName}/${mapping.serviceName}/${mapping.port}`;
}
