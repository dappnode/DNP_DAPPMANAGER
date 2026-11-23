import { listPackages } from "@dappnode/dockerapi";
import { FullBackupInfo } from "@dappnode/types";
import { getPackageBackupInfo, readInstalledManifest } from "../fullBackup/coverage.js";
import { FULL_BACKUP_PASSWORD_MIN_LENGTH } from "../fullBackup/create.js";

/**
 * What a full backup would contain, and which packages have data that is
 * not covered by their manifest `backup` paths
 */
export async function fullBackupInfo(): Promise<FullBackupInfo> {
  const packages = (await listPackages()).map((pkg) => {
    let manifest = null;
    try {
      manifest = readInstalledManifest(pkg.dnpName, pkg.isCore);
    } catch {
      // A broken manifest shows the package as not covered
    }
    return getPackageBackupInfo(pkg, manifest);
  });
  packages.sort((a, b) => a.dnpName.localeCompare(b.dnpName));
  return { passwordMinLength: FULL_BACKUP_PASSWORD_MIN_LENGTH, packages };
}
