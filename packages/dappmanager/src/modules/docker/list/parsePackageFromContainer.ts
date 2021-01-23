import { pick } from "lodash";
import { InstalledPackageData, PackageContainer } from "../../../types";

/**
 * Return containers grouped by parent package. Necessary for multi-service packages
 */
export function groupPackagesFromContainers(
  containers: PackageContainer[]
): InstalledPackageData[] {
  const dnps = new Map<string, InstalledPackageData>();
  for (const container of containers) {
    dnps.set(container.dnpName, {
      ...pick(container, [
        "dnpName",
        "instanceName",
        "version",
        "isDnp",
        "isCore",
        "dependencies",
        "avatarUrl",
        "origin",
        "chain",
        "domainAlias",
        "canBeFullnode"
      ]),
      containers: [
        ...(dnps.get(container.dnpName)?.containers || []),
        container
      ]
    });
  }
  return Array.from(dnps.values());
}
