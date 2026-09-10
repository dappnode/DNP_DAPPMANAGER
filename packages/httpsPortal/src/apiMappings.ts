import { HttpsPortalMapping } from "@dappnode/types";
import { HttpPortalEntry } from "./apiClient.js";
import { getExternalNetworkAlias } from "./domains.js";

/**
 * Return true only when the HTTPS Portal already contains this exact source and target mapping.
 *
 * A container can have multiple mappings, so matching by its network alias alone is not enough.
 * Authentication is not part of the comparison because the API returns the stored password hash.
 */
export function hasExactApiMapping(entries: HttpPortalEntry[], mapping: HttpsPortalMapping): boolean {
  const toHost = `${getExternalNetworkAlias(mapping)}:${mapping.port}`;

  return entries.some((entry) => entry.fromSubdomain === mapping.fromSubdomain && entry.toHost === toHost);
}

/** Return true when a container has at least one mapping in the HTTPS Portal. */
export function hasApiMappingForContainer(entries: HttpPortalEntry[], dnpName: string, serviceName: string): boolean {
  const mappingAlias = getExternalNetworkAlias({ serviceName, dnpName });

  return entries.some(({ toHost }) => toHost.split(":")[0] === mappingAlias);
}
