import { params } from "@dappnode/params";
import { getShortUniqueDnp } from "./getShortUniqueDnp";
import { ContainerNames } from "@dappnode/common";

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
  isExternal = false
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

/**
 * It return an array of aliases which includes at lease the private network alias
 * @param container
 * @returns
 */
export function getPrivateNetworkAliases(
  container: ContainerNames & { isMainOrMonoservice: boolean }
): string[] {

  const {
    isMainOrMonoservice,
    dnpName,
    serviceName
  } = container;

  const aliases: string[] = [];

  // push full alias
  // The "isMainOrMonoservice" is false because we always want a full alias for each service (container)
  aliases.push(buildNetworkAlias({ dnpName, serviceName, isMainOrMonoservice: false }));

  // push short alias
  // if service is "isMain", we also want to add the short alias for it
  if (isMainOrMonoservice) aliases.push(buildNetworkAlias({ dnpName, serviceName, isMainOrMonoservice: true }));

  // Special unique alias for the Admin UI
  if (dnpName === params.dappmanagerDnpName)
    aliases.push(...params.DAPPMANAGER_ALIASES);

  // Ensure uniqueness
  return [...new Set(aliases)];
}