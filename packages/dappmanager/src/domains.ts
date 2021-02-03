import { getContainerDomain } from "./params";

function stripCharacters(s: string): string {
  return s.replace(RegExp("_", "g"), "");
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

type ContainerNames = { serviceName: string; dnpName: string };

export function getPrivateNetworkAlias(container: ContainerNames): string {
  const fullEns = getContainerDomain(container);
  return `${shortUniqueDappnodeEns(fullEns)}.dappnode`;
}

export function getExternalNetworkAlias(container: ContainerNames): string {
  const fullEns = getContainerDomain(container);
  return `${shortUniqueDappnodeEns(fullEns)}.external`;
}
