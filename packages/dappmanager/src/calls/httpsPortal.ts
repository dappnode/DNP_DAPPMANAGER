import { HttpsPortalMapping, ExposableServiceMapping } from "@dappnode/common";
import {
  httpsPortalMappingAdd as _httpsPortalMappingAdd,
  httpsPortalMappingRemove as _httpsPortalMappingRemove,
  httpsPortalMappingsGet as _httpsPortalMappingsGet,
  httpsPortalExposableServicesGet as _httpsPortalExposableServicesGet,
  httpsPortalMappingsRecreate as _httpsPortalMappingsRecreate
} from "@dappnode/httpsportal/calls";

/**
 * HTTPs Portal: map a subdomain
 */
export async function httpsPortalMappingAdd({
  mapping
}: {
  mapping: HttpsPortalMapping;
}): Promise<void> {
  await _httpsPortalMappingAdd({ mapping });
}

/**
 * HTTPs Portal: remove an existing mapping
 */
export async function httpsPortalMappingRemove({
  mapping
}: {
  mapping: HttpsPortalMapping;
}): Promise<void> {
  await _httpsPortalMappingRemove({ mapping });
}

/**
 * HTTPs Portal: recreate HTTPs portal mapping
 */
export async function httpsPortalMappingsRecreate(): Promise<void> {
  await _httpsPortalMappingsRecreate();
}

/**
 * HTTPs Portal: get all mappings
 */
export async function httpsPortalMappingsGet(): Promise<HttpsPortalMapping[]> {
  return _httpsPortalMappingsGet({});
}

/**
 * HTTPs Portal: get exposable services with metadata
 */
export async function httpsPortalExposableServicesGet(): Promise<
  ExposableServiceMapping[]
> {
  return _httpsPortalExposableServicesGet();
}
