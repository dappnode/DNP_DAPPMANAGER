import { gte } from "semver";

/**
 * Compute version id:
 * admin@0.2.4,vpn@0.2.2,core@0.2.6
 * - Sort alphabetically to ensure the version ID is deterministic
 *
 * @param coreDnps
 * @returns versionId = "admin@0.2.4,vpn@0.2.2,core@0.2.6"
 */
export function getCoreVersionId(
  coreDnps: { dnpName: string; version: string }[]
): string {
  return coreDnps
    .filter(({ dnpName, version }) => dnpName && version)
    .map(({ dnpName, version }) => [dnpName.split(".")[0], version].join("@"))
    .sort()
    .join(",");
}

export function parseCoreVersionId(
  versionId: string
): { dnpName: string; version: string }[] {
  return versionId
    .split(",")
    .filter(nameAtVersion => nameAtVersion)
    .map(nameAtVersion => {
      const [shortName, version] = nameAtVersion.split("@");
      return { dnpName: `${shortName}.dnp.dappnode.eth`, version };
    });
}

/**
 * Returns true if the package versions of `coreVersionId` are greater than or equal
 * to their version in `coreDnps`
 * @param coreVersionId "admin@0.2.4,vpn@0.2.2,core@0.2.6"
 */
export function isVersionIdUpdated(
  coreVersionId: string,
  currentCorePackages: { dnpName: string; version: string }[]
): boolean {
  const currentVersions = new Map<string, string>(
    currentCorePackages.map(p => [p.dnpName, p.version])
  );
  const versionIdDnps = parseCoreVersionId(coreVersionId);
  return versionIdDnps.every(versionIdDnp => {
    const currentVersion = currentVersions.get(versionIdDnp.dnpName);
    return currentVersion && gte(currentVersion, versionIdDnp.version);
  });
}
