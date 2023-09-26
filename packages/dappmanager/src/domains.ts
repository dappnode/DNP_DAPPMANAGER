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
 * - Strip .dappnode, .eth, .dnp, .public
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

export function getContainerAlias(container: ContainerNames): string {
  if (!container.serviceName || !container.dnpName) {
    throw Error("serviceName and dnpName are required when setting alias")
  }
  else { 
    const alias = `${container.serviceName}.${container.dnpName}`;
    return `${shortUniqueDappnodeEns(alias)}.dappnode`;
  }
}

export function getContainerRootAlias(dnpName: string): string {
    return `${shortUniqueDappnodeEns(dnpName)}.dappnode`;
  }

/**
 * Returns base alias for a container of the dncore_network. 
 * - If the container is part of a multiservice package the alias will be "service1.example.dappnode"
 * - If the container is part of a mono service package, the alias will be "example.dappnode"
 * @param serviceName "beacon-chain" @param dnpName "prysm.dnp.dappnode.eth"
 * @returns 
 * - "beacon-chain.prysm.dappnode"
 */
export function getPrivateNetworkAlias(container: ContainerNames): string {
  const fullEns = getContainerDomain(container);
  return `${shortUniqueDappnodeEns(fullEns)}.dappnode`;
}

export function getPrivateNetworkAliases(
  container: ContainerNames & { isMainOrMonoService: boolean }
): string[] {
  const aliases: string[] = [getContainerAlias(container)];

  // mono services will always be main.
  // If mono service or multiserviceMain, add the root alias (alias without service name)
  if (container.isMainOrMonoService) {
    const rootAlias = getContainerRootAlias(container.dnpName);
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
