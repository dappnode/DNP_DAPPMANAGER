import fs from "fs";
import { params } from "@dappnode/params";
import { getManifestPath, isNotFoundError, yamlParse } from "@dappnode/utils";
import { FullBackupCoverage, FullBackupPackageInfo, InstalledPackageData, Manifest } from "@dappnode/types";

/**
 * Read the manifest stored at install time. Returns null if it is missing,
 * so one broken package does not block the backup of all the others.
 */
export function readInstalledManifest(dnpName: string, isCore: boolean): Manifest | null {
  try {
    return yamlParse<Manifest>(fs.readFileSync(getManifestPath(dnpName, isCore), "utf8"));
  } catch (e) {
    if (isNotFoundError(e)) return null;
    throw Error(`Error reading manifest of ${dnpName}: ${e.message}`);
  }
}

export function getNamedVolumes(pkg: InstalledPackageData): string[] {
  const names = new Set<string>();
  for (const container of pkg.containers) {
    for (const volume of container.volumes) if (volume.name) names.add(volume.name);
  }
  return [...names].sort();
}

/**
 * A package's non-reproducible data is covered when its manifest declares
 * `backup` paths. The dappmanager's own state is backed up from its DBs.
 */
export function getCoverage(pkg: InstalledPackageData, manifest: Manifest | null): FullBackupCoverage {
  if (pkg.dnpName === params.dappmanagerDnpName) return "covered";
  if (manifest?.backup && manifest.backup.length > 0) return "covered";
  return getNamedVolumes(pkg).length > 0 ? "not-covered" : "stateless";
}

export function getPackageBackupInfo(pkg: InstalledPackageData, manifest: Manifest | null): FullBackupPackageInfo {
  return {
    dnpName: pkg.dnpName,
    version: pkg.version,
    isCore: pkg.isCore,
    coverage: getCoverage(pkg, manifest),
    backupItems: (manifest?.backup ?? []).map((item) => item.name),
    namedVolumes: getNamedVolumes(pkg)
  };
}
