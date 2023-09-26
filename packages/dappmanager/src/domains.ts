import { params } from "@dappnode/params";
import { getContainerDomain } from "@dappnode/types";

export type ContainerNames = { serviceName: string; dnpName: string };

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
export function determineNetworkAlias({
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
    ? `${getShortDnpName(dnpName)}.${endDomain}`
    : `${serviceName}.${getShortDnpName(dnpName)}.${endDomain}`;
}

/**
 * It return an array of aliases which includes at lease the private network alias
 * @param container
 * @returns
 */
export function getPrivateNetworkAliases(
  container: ContainerNames & { isMain: boolean }
): string[] {

  const {
    isMain,
    dnpName,
    serviceName
  } = container;
  
  const aliases: string[] = [];

  // push full alias
  // The "isMainOrMonoservice" is false because we always want a full alias for each service (container)
  aliases.push(determineNetworkAlias({dnpName, serviceName, isMainOrMonoservice: false}));

  // push short alias
  // if service is "isMain", we also want to add the short alias for it
  if (isMain) aliases.push(determineNetworkAlias({dnpName, serviceName, isMainOrMonoservice: true}));
  
  // Special unique alias for the Admin UI
  if (dnpName === params.dappmanagerDnpName)
    aliases.push(...params.DAPPMANAGER_ALIASES);

  // Ensure uniqueness
  return [...new Set(aliases)];
}

export function getExternalNetworkAlias(container: ContainerNames): string {
  const fullEns = getContainerDomain(container);
  return `${getShortDnpName(fullEns)}.external`;
}

export function getPublicSubdomain(container: ContainerNames): string {
  const fullEns = getContainerDomain(container);
  return stripBadDomainChars(getShortDnpName(fullEns));
}

/**
 * UTILS
 */

export function stripCharacters(s: string): string {
  return s.replace(RegExp("_", "g"), "");
}

export function stripBadDomainChars(s: string): string {
  // eslint-disable-next-line no-useless-escape
  return s.replace(/[^a-zA-Z\-]+/g, "-");
}

/**
 * - Strip container prefix
 * - Strip .dappnode, .eth, .dnp
 * - Strip "_"
 *
 * @param name "bitcoin.dnp.dappnode.eth"
 * @returns "bitcoin"
 * - "bitcoin.dnp.dappnode.eth" > "bitcoin"
 * - "other.public.dappnode.eth" > "other.public"
 */
function getShortDnpName(dnpName: string): string {
  for (const s of [".dnp.dappnode.eth", ".dappnode.eth", ".eth"])
    if (dnpName.endsWith(s)) dnpName = dnpName.slice(0, -s.length);
  return stripCharacters(dnpName);
}
