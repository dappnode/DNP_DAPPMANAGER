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
  /**
   * Web3Signer: a backup made when moving or reinstalling this node removes
   * its validator keys through the Staking Brain and stores their exact
   * slashing protection
   */
  exportsSlashingProtection: boolean;
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
  /**
   * Web3Signer packages whose validator keys were removed from this node
   * and whose slashing protection is in the backup
   */
  slashingProtectionExported: { dnpName: string; validatorCount: number }[];
  /**
   * Validator packages whose data (keys and slashing protection) was left
   * out so they kept validating without a pause. Only their settings are in
   * the backup
   */
  skippedValidators: string[];
}

/**
 * A backup kept on the node because it removed validator keys from it: it
 * is the only copy of them until the admin has saved the file and discards
 * this one. Download it with GET /full-backup/pending/:fileName
 */
export interface FullBackupPendingBackup {
  fileName: string;
  sizeBytes: number;
  createdAt: string;
  slashingProtectionExported: FullBackupCreateResult["slashingProtectionExported"];
}

/**
 * Exact slashing protection of a Web3Signer package, exported when its keys
 * were deleted through the Staking Brain (keymanager API) for a backup made
 * to move or reinstall the node. After that delete the backed-up node can no
 * longer sign with these keys
 */
export interface FullBackupSlashingProtection {
  source: "staking-brain";
  /** Archive path of the EIP-3076 interchange JSON, absent if there were no keys */
  file?: string;
  /** Validator public keys removed from the backed-up node, 0x-prefixed lowercase */
  pubkeys: string[];
}

/**
 * What a backup being created is doing:
 * - preparing: checking disk space and saving the dappmanager's settings
 * - stopping: stopping a validator so its slashing protection is exact
 * - exporting: removing a Web3Signer's keys through its Staking Brain and
 *   exporting their slashing protection, for a backup made to move the node
 * - copying: copying a package's `backup` data
 * - restarting: starting a validator again after its copy
 * - archiving: compressing and encrypting everything into the backup file
 */
export type FullBackupStep = "preparing" | "stopping" | "exporting" | "copying" | "restarting" | "archiving";

export interface FullBackupProgress {
  step: FullBackupStep;
  startedAt: string;
  /** Package being stopped, copied or restarted */
  dnpName?: string;
  packagesDone: number;
  packagesTotal: number;
  /** Bytes of package data copied so far */
  copiedBytes: number;
  /** While archiving: bytes written into the backup file, of `archiveTotalBytes` */
  archivedBytes: number;
  archiveTotalBytes: number;
}

/**
 * Whether a full backup is being created, what it is doing, and how the last
 * one ended. Lets the UI show progress and recover a result whose HTTP
 * response was lost
 */
export interface FullBackupStatus {
  inProgress: boolean;
  /** Set while a backup is being created */
  progress?: FullBackupProgress;
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
  /**
   * Web3Signer only, in backups made to move or reinstall the node. When
   * present, restore imports the keys through the Staking Brain with this
   * slashing protection instead of writing the keystore files back
   */
  slashingProtection?: FullBackupSlashingProtection;
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

/**
 * Restore
 * - merge: install and configure the backup's packages on this node, keep
 *   this node's identity, admin login and system settings
 * - clone: make this node as close as possible to the backed-up one:
 *   identity, admin login and system settings too, and remove packages that
 *   are not in the backup (their volumes are kept)
 */
export type FullBackupRestoreMode = "merge" | "clone";

/**
 * - install: not installed here, install the backup's version
 * - update: installed at an older version, update to the backup's version
 * - apply-settings: installed at the same version, apply the backup's settings
 * - keep-newer: installed at a newer version, keep it and apply settings that still fit
 * - skip: not restored, see reason
 * - remove: clone only, installed here but not in the backup
 */
export type FullBackupRestoreAction = "install" | "update" | "apply-settings" | "keep-newer" | "skip" | "remove";

export interface FullBackupRestorePackagePlan {
  dnpName: string;
  action: FullBackupRestoreAction;
  backupVersion: string | null;
  installedVersion: string | null;
  isCore: boolean;
  /** Whether the manifest `backup` data from the file is written into the package */
  restoreData: boolean;
  /**
   * Restore packages (merge) only: the user chooses whether the data is
   * written, `restoreData` is the default choice
   */
  dataSelectable?: boolean;
  /** Holds validator keys or slashing protection: stays stopped after restore */
  validator: boolean;
  /**
   * Web3Signer only
   * - included: keys are imported through the Staking Brain with the exact
   *   slashing protection exported when the backup was made
   * - missing: the backup holds the keystores but no slashing protection
   */
  slashingProtection?: "included" | "missing";
  /** Web3Signer with slashing protection: number of validator keys to import */
  validatorKeyCount?: number;
  reason?: string;
}

export interface FullBackupRestorePlan {
  mode: FullBackupRestoreMode;
  packages: FullBackupRestorePackagePlan[];
  /** Applied to this node's dappmanager */
  restoresIdentity: boolean;
  restoresAdminLogin: boolean;
  restoresSystemSettings: boolean;
  warnings: string[];
}

export interface FullBackupInspectResult {
  createdAt: string;
  dappmanagerVersion?: string;
  arch: string;
  packageCount: number;
  /** When non-empty the backup cannot be restored on this node */
  blockers: string[];
  /** True if any package holds validator keys: the old node must be off */
  requiresValidatorConfirmation: boolean;
  /** Suggested mode: clone when this node has no packages of its own yet */
  suggestedMode: FullBackupRestoreMode;
  plans: { merge: FullBackupRestorePlan; clone: FullBackupRestorePlan };
}

export type FullBackupRestoreStepStatus = "pending" | "running" | "done" | "failed" | "skipped";

export interface FullBackupRestoreStep {
  id: string;
  title: string;
  status: FullBackupRestoreStepStatus;
  error?: string;
}

export interface FullBackupRestoreStatus {
  status: "idle" | "running" | "done" | "failed";
  mode?: FullBackupRestoreMode;
  startedAt?: string;
  finishedAt?: string;
  steps: FullBackupRestoreStep[];
  warnings: string[];
  /** Path on the host of the backup taken of this node before restoring */
  safetySnapshot?: string;
  /** Validator packages restored and left stopped on purpose */
  stoppedValidators: string[];
}
