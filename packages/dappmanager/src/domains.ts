import { ContainerNames } from "@dappnode/common";
import { getContainerDomain } from "@dappnode/types";
import { shortUniqueDappnodeEns } from "@dappnode/utils";

export function stripBadDomainChars(s: string): string {
  // eslint-disable-next-line no-useless-escape
  return s.replace(/[^a-zA-Z\-]+/g, "-");
}

export function getExternalNetworkAlias(container: ContainerNames): string {
  const fullEns = getContainerDomain(container);
  return `${shortUniqueDappnodeEns(fullEns)}.external`;
}

export function getPublicSubdomain(container: ContainerNames): string {
  const fullEns = getContainerDomain(container);
  return stripBadDomainChars(shortUniqueDappnodeEns(fullEns));
}