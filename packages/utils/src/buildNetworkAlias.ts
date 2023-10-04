import { getShortUniqueDnp } from "./getShortUniqueDnp";

// TODO: unit testing

/**
 * This function return fullNetworkAlias or shortNetworkAlias:
 * - shortDnpName is dnpName.split(0)["."]. i.e dnpName = "dappmanager.dnp.dappnode.eth" => shortDnpName = "dappmanager"
 *
 * - i.e fullNetworkAlias: (serviceName..dappnode) "dappmanager.dnp.dappnode.eth.dappmanager.dappnode"
 * - i.e shortNetworkAlias: () "dappmanager.dappnode"
 *
 * - For dnp packages ( example.dnp.dappnode.eth). Whether it's a mono or multi-service package:
 *   - Each service should have an alias format of <service_name>.example.dappnode.
 *   - If it's the main service, also include example.dappnode.
 *
 * - For public packages ( example.public.dappnode.eth). Whether it's a mono or multi-service package:
 *   - Each service should have an alias format of <service_name>.example.public.dappnode.
 *   - If it's the main service, also include example.public.dappnode.
 *
 * @param dnpName dappnode dnp name
 * @param serviceName container service name
 * @param isMainOrMonoservice IF true returns the full network alias, otherwise the short network alias
 * @param isExternal is the container external
 * @param short if true, it will return the short version of the dnpName otherwise the full network alias
 * @returns the root private network alias. It
 */
export function buildNetworkAlias({
  dnpName,
  serviceName,
  isMainOrMonoservice,
  isExternal = false,
}: {
  dnpName: string;
  serviceName: string;
  isMainOrMonoservice: boolean;
  isExternal?: boolean;
}): string {
  const endDomain = isExternal ? "dappnode.external" : "dappnode";

  return isMainOrMonoservice
    ? `${getShortUniqueDnp(dnpName)}.${endDomain}`
    : `${serviceName}.${getShortUniqueDnp(dnpName)}.${endDomain}`;
}
