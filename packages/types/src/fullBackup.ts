import { PackageBackup } from "./manifest.js";
import { HttpsPortalMapping, PackageVersionData, UserSettings } from "./calls.js";

/**
 * How well a package's non-reproducible data is covered by a full backup
 * - covered: the manifest declares `backup` paths
 * - not-covered: the package has named volumes but declares no `backup` paths,
 *   so its data is NOT in the backup
 * - stateless: no named volumes, nothing to lose
 */
export type FullBackupCoverage = "covered" | "not-covered" | "stateless";

export interface FullBackupPackageInfo {
  dnpName: string;
  version: string;
  isCore: boolean;
  coverage: FullBackupCoverage;
  /** Holds validator keys or slashing protection */
  validator: boolean;
  /** Names of the manifest `backup` items */
  backupItems: string[];
  /** Named volumes of the package, for reference and future opt-in volume backups */
  namedVolumes: string[];
}

export interface FullBackupInfo {
  /** Minimum length for the backup encryption password */
  passwordMinLength: number;
  packages: FullBackupPackageInfo[];
}

export interface FullBackupCreateResult {
  /** Use with the /download/:fileId route */
  fileId: string;
  fileName: string;
  sizeBytes: number;
  /** Non-fatal problems, e.g. a declared backup path that does not exist */
  warnings: string[];
  /** Validator packages left stopped because the user is moving this node */
  stoppedValidators: string[];
}

/**
 * Whether a full backup is being created, and how the last one ended. Lets
 * the UI recover a result whose HTTP response was lost
 */
export interface FullBackupStatus {
  inProgress: boolean;
  /** Last backup since the dappmanager started, kept while its download link is valid */
  last?: {
    finishedAt: string;
    /** Absent if the backup failed */
    result?: FullBackupCreateResult;
    error?: string;
  };
}

/** Manifest `backup` item and where its data was stored inside the archive */
export interface FullBackupItemEntry extends PackageBackup {
  /** Archive path of the tar produced by the docker archive API, absent if it failed */
  file?: string;
  error?: string;
}

export interface FullBackupPackageEntry {
  dnpName: string;
  version: string;
  /** IPFS hash when the package was installed by hash; "dev" for dev installs */
  origin?: string;
  isCore: boolean;
  isDev?: boolean;
  coverage: FullBackupCoverage;
  namedVolumes: string[];
  domainAlias?: string[];
  /** Archive paths of the copied package files, absent if missing on disk */
  files: {
    compose?: string;
    manifest?: string;
    userSettings: string;
  };
  backup: FullBackupItemEntry[];
}

/**
 * `backup-manifest.json`, always the first entry of the archive so restore
 * can preview a backup by decrypting only the start of the file
 */
export interface FullBackupManifest {
  formatVersion: 1;
  createdAt: string;
  dappmanager: PackageVersionData;
  arch: string;
  /** Archive paths of the dappmanager state files */
  dappmanagerFiles: {
    mainDb: string;
    cacheDb: string;
    nexusDb?: string;
    adminPasswords?: string;
    adminStatus?: string;
    adminRecoveryToken?: string;
    httpsMappings?: string;
  };
  packages: FullBackupPackageEntry[];
}

/** Content of each package's user-settings.json inside the archive */
export type FullBackupUserSettings = UserSettings;

/** Content of https-mappings.json inside the archive */
export type FullBackupHttpsMappings = HttpsPortalMapping[];
