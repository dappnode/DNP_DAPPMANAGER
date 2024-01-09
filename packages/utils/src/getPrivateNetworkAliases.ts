import { ContainerNames } from "@dappnode/common";
import { params } from "@dappnode/params";
import { buildNetworkAlias } from "./buildNetworkAlias.js";

/**
 * It returns an array of aliases which includes at lease the private network alias
 * @param container
 * @returns
 */
export function getPrivateNetworkAliases(
  container: ContainerNames & { isMainOrMonoservice: boolean }
): string[] {
  const { isMainOrMonoservice, dnpName, serviceName } = container;

  const aliases: string[] = [];

  // push full alias
  // The "isMainOrMonoservice" is false because we always want a full alias for each service (container)
  aliases.push(
    buildNetworkAlias({ dnpName, serviceName, isMainOrMonoservice: false })
  );

  // push short alias
  // if service is "isMain", we also want to add the short alias for it
  if (isMainOrMonoservice)
    aliases.push(
      buildNetworkAlias({ dnpName, serviceName, isMainOrMonoservice: true })
    );

  // Special unique alias for the Admin UI
  if (dnpName === params.dappmanagerDnpName)
    aliases.push(...params.DAPPMANAGER_ALIASES);

  // Ensure uniqueness
  return [...new Set(aliases)];
}
