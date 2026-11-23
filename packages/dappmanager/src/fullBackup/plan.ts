import semver from "semver";
import {
  FullBackupInspectResult,
  FullBackupItemEntry,
  FullBackupManifest,
  FullBackupPackageEntry,
  FullBackupRestoreMode,
  FullBackupRestorePackagePlan,
  FullBackupRestorePlan
} from "@dappnode/types";
import { isValidatorPackage, VALIDATOR_DATA_LEFT_OUT } from "./coverage.js";

export { isValidatorPackage };

export const DAPPMANAGER_DNP_NAME = "dappmanager.dnp.dappnode.eth";

/** Packages that can never be removed by a clone restore */
const NEVER_REMOVE = new Set([DAPPMANAGER_DNP_NAME, "bind.dnp.dappnode.eth"]);

export interface InstalledPackageSummary {
  dnpName: string;
  version: string;
  isCore: boolean;
}

/**
 * SQLite side files (-wal, -shm, -journal) only exist while the database is
 * open. Backup creation records one that was absent with this error and no
 * file: nothing was lost, so it is not reported as a failed item
 */
function isAbsentSideFile(item: FullBackupItemEntry): boolean {
  return /-(wal|shm|journal)$/.test(item.path) && Boolean(item.error?.startsWith("not present"));
}

function hasBackupData(pkg: FullBackupPackageEntry): boolean {
  return pkg.backup.some((item) => Boolean(item.file));
}

/** -1, 0, 1, or null when either version is not valid semver */
function compareVersions(installed: string, backup: string): number | null {
  if (!semver.valid(installed) || !semver.valid(backup)) return null;
  return semver.compare(installed, backup);
}

function planBackupPackage(
  pkg: FullBackupPackageEntry,
  installed: InstalledPackageSummary | undefined,
  mode: FullBackupRestoreMode
): FullBackupRestorePackagePlan {
  const base = {
    dnpName: pkg.dnpName,
    backupVersion: pkg.version,
    installedVersion: installed?.version ?? null,
    isCore: pkg.isCore,
    validator: isValidatorPackage(pkg)
  };
  const skip = (reason: string): FullBackupRestorePackagePlan => ({
    ...base,
    action: "skip",
    restoreData: false,
    reason
  });

  if (pkg.dnpName === DAPPMANAGER_DNP_NAME) {
    return skip("The dappmanager restores its own settings and is not reinstalled");
  }
  if (NEVER_REMOVE.has(pkg.dnpName) || pkg.dnpName === "core.dnp.dappnode.eth") {
    return skip("System package, kept as configured on this node");
  }
  if (pkg.isDev || pkg.origin === "dev") return skip("Installed for development, it cannot be downloaded again");
  if (pkg.isCore && mode === "merge") return skip("System package, kept as configured on this node");

  const withData = hasBackupData(pkg);
  if (!installed) return { ...base, action: "install", restoreData: withData };

  // Data of an installed package is only replaced when cloning: merge keeps
  // what is already running on this node
  const replaceData = mode === "clone" && withData;
  const comparison = compareVersions(installed.version, pkg.version);
  if (comparison === null) {
    return {
      ...base,
      action: "apply-settings",
      restoreData: false,
      reason: "Versions cannot be compared, data on this node is kept"
    };
  }
  if (comparison === 0) return { ...base, action: "apply-settings", restoreData: replaceData };
  if (comparison < 0) return { ...base, action: "update", restoreData: replaceData };
  return {
    ...base,
    action: "keep-newer",
    restoreData: false,
    reason: `This node runs a newer version (${installed.version}); its data is kept to avoid running older software on newer data`
  };
}

export function planRestore({
  manifest,
  installed,
  mode
}: {
  manifest: FullBackupManifest;
  installed: InstalledPackageSummary[];
  mode: FullBackupRestoreMode;
}): FullBackupRestorePlan {
  const installedByName = new Map(installed.map((pkg) => [pkg.dnpName, pkg]));
  const backupNames = new Set(manifest.packages.map((pkg) => pkg.dnpName));
  const warnings: string[] = [];

  const packages = manifest.packages.map((pkg) => planBackupPackage(pkg, installedByName.get(pkg.dnpName), mode));

  if (mode === "clone") {
    for (const pkg of installed) {
      if (backupNames.has(pkg.dnpName) || pkg.isCore || NEVER_REMOVE.has(pkg.dnpName)) continue;
      packages.push({
        dnpName: pkg.dnpName,
        action: "remove",
        backupVersion: null,
        installedVersion: pkg.version,
        isCore: pkg.isCore,
        restoreData: false,
        validator: false,
        reason: "Not in the backup. Its volumes are kept"
      });
    }
  }

  for (const pkg of manifest.packages) {
    const leftOut = pkg.backup.filter((item) => item.error === VALIDATOR_DATA_LEFT_OUT);
    if (leftOut.length > 0) {
      warnings.push(
        `${pkg.dnpName}: its validator keys and slashing protection were left out of this backup so it kept validating. Import them again after the restore`
      );
    }
    const failed = pkg.backup.filter(
      (item) => !item.file && !isAbsentSideFile(item) && item.error !== VALIDATOR_DATA_LEFT_OUT
    );
    if (failed.length > 0) {
      warnings.push(`${pkg.dnpName}: ${failed.map((item) => item.name).join(", ")} could not be backed up originally`);
    }
    if (pkg.coverage === "not-covered") {
      warnings.push(`${pkg.dnpName}: its data was not in the backup, only its configuration is restored`);
    }
  }

  packages.sort((a, b) => a.dnpName.localeCompare(b.dnpName));
  return {
    mode,
    packages,
    restoresIdentity: mode === "clone",
    restoresAdminLogin: mode === "clone",
    restoresSystemSettings: mode === "clone",
    warnings
  };
}

export function inspectBackup({
  manifest,
  installed,
  dappmanagerVersion,
  arch
}: {
  manifest: FullBackupManifest;
  installed: InstalledPackageSummary[];
  /** Version of the running dappmanager, undefined in development builds */
  dappmanagerVersion: string | undefined;
  arch: string;
}): FullBackupInspectResult {
  const blockers: string[] = [];
  const backupVersion = manifest.dappmanager?.version;
  if (backupVersion && dappmanagerVersion && semver.valid(backupVersion) && semver.valid(dappmanagerVersion)) {
    if (semver.gt(backupVersion, dappmanagerVersion)) {
      blockers.push(
        `This backup was made with a newer dappmanager (${backupVersion}) than this node runs (${dappmanagerVersion}). Update this node first.`
      );
    }
  }

  const plans = {
    merge: planRestore({ manifest, installed, mode: "merge" }),
    clone: planRestore({ manifest, installed, mode: "clone" })
  };
  if (manifest.arch !== arch) {
    const warning = `The backup was made on ${manifest.arch} and this node is ${arch}: some packages may not be available`;
    plans.merge.warnings.unshift(warning);
    plans.clone.warnings.unshift(warning);
  }

  const hasOwnPackages = installed.some((pkg) => !pkg.isCore);
  return {
    createdAt: manifest.createdAt,
    dappmanagerVersion: backupVersion,
    arch: manifest.arch,
    packageCount: manifest.packages.length,
    blockers,
    requiresValidatorConfirmation: manifest.packages.some(isValidatorPackage),
    suggestedMode: hasOwnPackages ? "merge" : "clone",
    plans
  };
}
