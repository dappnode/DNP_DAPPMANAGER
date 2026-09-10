import { pick } from "lodash-es";
import { InstalledPackageData, PackageContainer } from "@dappnode/types";

/**
 * Return containers grouped by parent package. Necessary for multi-service packages
 */
export function groupPackagesFromContainers(containers: PackageContainer[]): InstalledPackageData[] {
  const dnpMap = new Map<string, InstalledPackageData>();
  for (const container of containers) {
    let dnp = dnpMap.get(container.dnpName);
    if (!dnp) {
      dnp = {
        ...pick(container, [
          "dnpName",
          "instanceName",
          "version",
          "isDnp",
          "isCore",
          "isDev",
          "dependencies",
          "avatarUrl",
          "origin",
          "chain",
          "categories",
          "domainAlias",
          "canBeFullnode"
        ]),
        containers: []
      };
      dnpMap.set(container.dnpName, dnp);
    }

    dnp.containers.push(container);
  }

  return Array.from(dnpMap.values());
}
