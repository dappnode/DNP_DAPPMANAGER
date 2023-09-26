import { params } from "@dappnode/params";
import { getContainerDomain } from "@dappnode/types";

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
export function shortUniqueDappnodeEns(dnpName: string): string {
  for (const s of [".dnp.dappnode.eth", ".dappnode.eth", ".eth"])
    if (dnpName.endsWith(s)) dnpName = dnpName.slice(0, -s.length);
  return stripCharacters(dnpName);
}

export type ContainerNames = { serviceName: string; dnpName: string };

export function getPrivateNetworkAlias(container: ContainerNames): string {
  const fullEns = getContainerDomain(container);
  return `${shortUniqueDappnodeEns(fullEns)}.dappnode`;
}

export function getPrivateNetworkAliases(
  container: ContainerNames & { isMain: boolean }
): string[] {
  const aliases: string[] = [getPrivateNetworkAlias(container)];

  if (container.isMain) {
    const rootAlias = getPrivateNetworkAlias({
      dnpName: container.dnpName,
      serviceName: container.dnpName
    });
    aliases.push(rootAlias);
  }

  // Special unique alias for the Admin UI
  if (container.dnpName === params.dappmanagerDnpName)
    aliases.push(...params.DAPPMANAGER_ALIASES);

  // Ensure uniqueness
  return [...new Set(aliases)];
}

export function getExternalNetworkAlias(container: ContainerNames): string {
  const fullEns = getContainerDomain(container);
  return `${shortUniqueDappnodeEns(fullEns)}.external`;
}

export function getPublicSubdomain(container: ContainerNames): string {
  const fullEns = getContainerDomain(container);
  return stripBadDomainChars(shortUniqueDappnodeEns(fullEns));
}
