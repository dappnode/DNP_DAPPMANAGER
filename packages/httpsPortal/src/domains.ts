import { ContainerNames, getContainerDomain } from "@dappnode/types";
import { getShortUniqueDnp } from "@dappnode/utils";

export function stripBadDomainChars(s: string): string {
  // eslint-disable-next-line no-useless-escape
  return s.replace(/[^a-zA-Z\-]+/g, "-");
}

export function getExternalNetworkAlias(container: ContainerNames): string {
  const fullEns = getContainerDomain(container);
  return `${getShortUniqueDnp(fullEns)}.external`;
}

export function getPublicSubdomain(container: ContainerNames): string {
  const fullEns = getContainerDomain(container);
  return stripBadDomainChars(getShortUniqueDnp(fullEns));
}
