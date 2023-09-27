import { params } from "@dappnode/params";
import { getContainerDomain } from "@dappnode/types";
import { shortUniqueDappnodeEns } from "./shortUniqueDappnodeEns.js";
import { ContainerNames } from "@dappnode/common";

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
      serviceName: container.dnpName,
    });
    aliases.push(rootAlias);
  }

  // Special unique alias for the Admin UI
  if (container.dnpName === params.dappmanagerDnpName)
    aliases.push(...params.DAPPMANAGER_ALIASES);

  // Ensure uniqueness
  return [...new Set(aliases)];
}
