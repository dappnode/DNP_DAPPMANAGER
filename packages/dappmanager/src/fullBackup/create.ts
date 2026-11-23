import fs from "fs";
import path from "path";
import zlib from "zlib";
import crypto from "crypto";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import tar from "tar-stream";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";
import { httpsPortal } from "@dappnode/httpsportal";
import { dockerGetArchive, listPackages } from "@dappnode/dockerapi";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { getDockerComposePath, getManifestPath } from "@dappnode/utils";
import {
  FullBackupCreateResult,
  FullBackupHttpsMappings,
  FullBackupItemEntry,
  FullBackupManifest,
  FullBackupPackageEntry,
  FullBackupSlashingProtection,
  FullBackupProgress,
  FullBackupStatus,
  InstalledPackageData,
  Manifest
} from "@dappnode/types";
import { getVersionData } from "../utils/getVersionData.js";
import { createFileTransferId, registerTempTransferFile, TEMP_TRANSFER_TTL_MS } from "../uploads/tempTransfer.js";
import { createEncryptStream, EncryptOptions } from "./format.js";
import { cacheDbIncludedKeys, mainDbIncludedKeys, nexusDbIncludedKeys, pickKeys } from "./dbKeys.js";
import {
  getCoverage,
  getNamedVolumes,
  isValidatorPackage,
  readInstalledManifest,
  VALIDATOR_DATA_LEFT_OUT
} from "./coverage.js";
import { canStopForBackup, RestartPackage, stopPackageForBackup } from "./packageStop.js";
import {
  BrainClient,
  createBrainClient,
  exportSlashingProtection,
  findWeb3signerItems,
  importKeysThroughBrain,
  interchangePubkeys,
  isWeb3signerPackage,
  listKeysInBackup,
  readBackedUpKeys,
  SlashingExportError,
  SlashingInterchange,
  someOf,
  shortPubkey,
  stoppedKeyServices,
  waitForBrain
} from "./web3signer.js";
import { getPendingBackupDir, keepPendingBackup } from "./pending.js";

export const FULL_BACKUP_PASSWORD_MIN_LENGTH = 10;
const FULL_BACKUP_PASSWORD_MAX_LENGTH = 1024;
const MIN_FREE_DISK_BYTES = 1024 * 1024 * 1024;
const DISK_SPACE_CHECK_INTERVAL_BYTES = 64 * 1024 * 1024;
export const MANIFEST_ARCHIVE_PATH = "backup-manifest.json";

/** Names used as archive path segments: no separators, no dot-only names */
const SAFE_SEGMENT = /^(?!\.{1,2}$)[A-Za-z0-9._-]{1,200}$/;

let backupInProgress = false;
/** What the backup being created is doing, polled by the UI */
let currentProgress: FullBackupProgress | undefined;
/** How the last backup ended, for a UI that lost the response of its request */
let lastBackup: FullBackupStatus["last"];

export function getFullBackupStatus(): FullBackupStatus {
  // The file of the last backup is deleted when its download link expires
  const expired = lastBackup && Date.now() - Date.parse(lastBackup.finishedAt) > TEMP_TRANSFER_TTL_MS;
  return {
    inProgress: backupInProgress,
    ...(currentProgress ? { progress: { ...currentProgress } } : {}),
    ...(lastBackup && !expired ? { last: lastBackup } : {})
  };
}

/** External effects, injectable for tests */
export interface FullBackupDeps {
  listPackages: () => Promise<InstalledPackageData[]>;
  getArchive: (containerName: string, path: string) => Promise<NodeJS.ReadableStream>;
  getHttpsMappings: () => Promise<FullBackupHttpsMappings>;
  /** Gracefully stop a package before copying its data; returns how to restart it */
  stopForBackup: (pkg: InstalledPackageData) => Promise<RestartPackage | null>;
  /** Staking Brain of a Web3Signer package */
  brainClient: (dnpName: string) => BrainClient;
  waitForBrain: (client: BrainClient) => Promise<void>;
}

const defaultDeps: FullBackupDeps = {
  listPackages,
  getArchive: dockerGetArchive,
  getHttpsMappings: () => httpsPortal.getMappings(),
  stopForBackup: stopPackageForBackup,
  brainClient: createBrainClient,
  waitForBrain: (client) => waitForBrain(client)
};

/**
 * SQLite side files: present only while the database is open. A cleanly
 * stopped package has none, which is not an error
 */
const OPTIONAL_SIDE_FILE = /-(wal|shm|journal)$/;

interface StageContext {
  deps: FullBackupDeps;
  staging: Staging;
  warnings: string[];
  /** The admin is moving or reinstalling this node: validators stay stopped */
  keepValidatorsStopped: boolean;
  /** Validators are not interrupted: their data is left out of the backup */
  skipValidatorData: boolean;
  stoppedValidators: string[];
  skippedValidators: string[];
  /** How to start again the validators this backup left stopped, if it fails */
  restartOnFailure: { dnpName: string; restart: RestartPackage }[];
  /** Web3Signer packages whose keys were deleted, to put them back if the backup fails */
  slashingExports: SlashingExport[];
  /** Updated as the backup goes, read by getFullBackupStatus */
  progress: FullBackupProgress;
}

interface SlashingExport {
  pkg: InstalledPackageData;
  keystoresTar: string;
  keystoresPath: string;
  brainDbTar: string | null;
  /** Keys that may no longer be loaded in Web3Signer */
  deleted: string[];
  interchange: SlashingInterchange | null;
  /** Set once the package was stopped after the export */
  restart: RestartPackage | null;
}

/** The disk cannot hold the backup: unlike a failed item, this stops the backup */
class DiskSpaceError extends Error {}

export function validateBackupPassword(password: unknown): asserts password is string {
  if (typeof password !== "string") throw Error("Backup password is required");
  if (password.length < FULL_BACKUP_PASSWORD_MIN_LENGTH)
    throw Error(`Backup password must be at least ${FULL_BACKUP_PASSWORD_MIN_LENGTH} characters`);
  if (password.length > FULL_BACKUP_PASSWORD_MAX_LENGTH) throw Error("Backup password is too long");
}

/**
 * Files staged on disk, in the order they are written to the archive.
 * The manifest is written first, separately.
 */
class Staging {
  readonly files: { archivePath: string; sourcePath: string }[] = [];
  /** Bytes of package data copied so far */
  private stagedBytes = 0;
  private nextDiskSpaceCheck = DISK_SPACE_CHECK_INTERVAL_BYTES;

  /** `onCopied` is called with the size of each chunk of package data copied */
  constructor(
    readonly dir: string,
    private readonly onCopied: (bytes: number) => void = () => undefined
  ) {}

  private target(archivePath: string): string {
    const sourcePath = path.join(this.dir, archivePath);
    fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
    this.files.push({ archivePath, sourcePath });
    return sourcePath;
  }

  writeJson(archivePath: string, data: unknown): string {
    fs.writeFileSync(this.target(archivePath), JSON.stringify(data, null, 2), { mode: 0o600 });
    return archivePath;
  }

  /** Copy a host file if it exists. Returns its archive path, or undefined */
  copyIfExists(archivePath: string, from: string): string | undefined {
    if (!fs.existsSync(from)) return undefined;
    fs.copyFileSync(from, this.target(archivePath));
    return archivePath;
  }

  /** Host path of a staged file */
  sourcePath(archivePath: string): string {
    return path.join(this.dir, archivePath);
  }

  async writeStream(archivePath: string, stream: NodeJS.ReadableStream): Promise<string> {
    const sourcePath = this.target(archivePath);
    try {
      await pipeline(stream, this.diskSpaceMeter(), fs.createWriteStream(sourcePath, { mode: 0o600 }));
    } catch (e) {
      this.files.pop();
      fs.rmSync(sourcePath, { force: true });
      throw e;
    }
    return archivePath;
  }

  /**
   * Counts the bytes copied and fails the copy with a DiskSpaceError as soon
   * as the disk cannot hold them twice, instead of filling it up
   */
  private diskSpaceMeter(): Transform {
    const check = (): Promise<void> => assertFreeDiskSpace(this.dir, this.stagedBytes);
    return new Transform({
      transform: (chunk: Buffer, _encoding, callback) => {
        this.stagedBytes += chunk.length;
        this.onCopied(chunk.length);
        if (this.stagedBytes < this.nextDiskSpaceCheck) return callback(null, chunk);
        this.nextDiskSpaceCheck = this.stagedBytes + DISK_SPACE_CHECK_INTERVAL_BYTES;
        check().then(() => callback(null, chunk), callback);
      },
      flush: (callback) => {
        check().then(() => callback(), callback);
      }
    });
  }
}

function stageDappmanagerFiles(staging: Staging): FullBackupManifest["dappmanagerFiles"] {
  return {
    mainDb: staging.writeJson("dappmanager/maindb.json", pickKeys(db.readMainDbRaw(), mainDbIncludedKeys)),
    cacheDb: staging.writeJson("dappmanager/cachedb.json", pickKeys(db.readCacheDbRaw(), cacheDbIncludedKeys)),
    nexusDb: staging.writeJson("dappmanager/nexusdb.json", pickKeys(db.readNexusDbRaw(), nexusDbIncludedKeys)),
    adminPasswords: staging.copyIfExists("dappmanager/admin-passwords.json", params.ADMIN_PASSWORDS_JSON_FILE),
    adminStatus: staging.copyIfExists("dappmanager/admin-status.json", params.ADMIN_STATUS_JSON_FILE),
    adminRecoveryToken: staging.copyIfExists("dappmanager/admin-recovery-token.txt", params.ADMIN_RECOVERY_FILE)
  };
}

async function stageBackupItems(
  deps: FullBackupDeps,
  staging: Staging,
  pkg: InstalledPackageData,
  manifest: Manifest | null,
  warnings: string[]
): Promise<FullBackupItemEntry[]> {
  const entries: FullBackupItemEntry[] = [];
  for (const item of manifest?.backup ?? []) {
    const entry: FullBackupItemEntry = { ...item };
    entries.push(entry);
    try {
      if (!SAFE_SEGMENT.test(item.name)) throw Error(`invalid backup name "${item.name}"`);
      if (!path.posix.isAbsolute(item.path)) throw Error(`backup path must be absolute, got "${item.path}"`);
      const container = pkg.containers.find((c) => !item.service || c.serviceName === item.service);
      if (!container) throw Error(`no container for service ${item.service}`);

      // The docker archive API works on stopped containers too
      const archive = await deps.getArchive(container.containerName, item.path);
      entry.file = await staging.writeStream(`packages/${pkg.dnpName}/backup/${item.name}.tar`, archive);
    } catch (e) {
      if (e instanceof DiskSpaceError) {
        throw new DiskSpaceError(`${e.message}. It ran out while copying "${item.name}" of ${pkg.dnpName}`);
      }
      if (e.statusCode === 404 && OPTIONAL_SIDE_FILE.test(item.path)) {
        entry.error = "not present (database closed cleanly)";
        continue;
      }
      const reason = e.statusCode === 404 ? `path ${item.path} does not exist` : e.message;
      entry.error = reason;
      warnings.push(`${pkg.dnpName}: could not back up "${item.name}": ${reason}`);
      logs.warn(`Full backup: could not back up ${pkg.dnpName} ${item.name}: ${reason}`);
    }
  }
  return entries;
}

async function stagePackage(ctx: StageContext, pkg: InstalledPackageData): Promise<FullBackupPackageEntry | null> {
  const { staging, warnings } = ctx;
  if (!SAFE_SEGMENT.test(pkg.dnpName)) {
    warnings.push(`Skipped package with unexpected name "${pkg.dnpName}"`);
    return null;
  }

  const base = `packages/${pkg.dnpName}`;
  let manifest: Manifest | null = null;
  try {
    manifest = readInstalledManifest(pkg.dnpName, pkg.isCore);
  } catch (e) {
    warnings.push(`${pkg.dnpName}: ${e.message}`);
  }

  let userSettings = {};
  try {
    userSettings = ComposeFileEditor.getUserSettingsIfExist(pkg.dnpName, pkg.isCore);
  } catch (e) {
    warnings.push(`${pkg.dnpName}: could not read user settings: ${e.message}`);
  }

  const { backup, slashingProtection } = await stagePackageData(ctx, pkg, manifest);
  return {
    dnpName: pkg.dnpName,
    version: pkg.version,
    origin: pkg.origin,
    isCore: pkg.isCore,
    isDev: pkg.isDev,
    coverage: getCoverage(pkg, manifest),
    namedVolumes: getNamedVolumes(pkg),
    domainAlias: pkg.domainAlias,
    files: {
      compose: staging.copyIfExists(`${base}/docker-compose.yml`, getDockerComposePath(pkg.dnpName, pkg.isCore)),
      manifest: staging.copyIfExists(`${base}/dappnode_package.json`, getManifestPath(pkg.dnpName, pkg.isCore)),
      userSettings: staging.writeJson(`${base}/user-settings.json`, userSettings)
    },
    backup,
    ...(slashingProtection ? { slashingProtection } : {})
  };
}

async function stagePackageData(
  ctx: StageContext,
  pkg: InstalledPackageData,
  manifest: Manifest | null
): Promise<{ backup: FullBackupItemEntry[]; slashingProtection?: FullBackupSlashingProtection }> {
  if (exportsSlashingProtection(ctx, pkg, manifest)) return stageWeb3signerForMove(ctx, pkg, manifest);
  return { backup: await stageBackupItemsStopped(ctx, pkg, manifest) };
}

/**
 * A Web3Signer whose keys this backup removes through its Staking Brain.
 * One without manifest `backup` items is copied like any other package
 */
function exportsSlashingProtection(ctx: StageContext, pkg: InstalledPackageData, manifest: Manifest | null): boolean {
  return (
    ctx.keepValidatorsStopped &&
    isWeb3signerPackage(pkg.dnpName) &&
    canStopForBackup(pkg) &&
    (manifest?.backup ?? []).length > 0
  );
}

/**
 * Before anything is stopped or deleted, check that every Web3Signer that
 * will export its slashing protection runs and its brain answers
 */
async function checkWeb3signersCanExport(ctx: StageContext, packages: InstalledPackageData[]): Promise<void> {
  if (!ctx.keepValidatorsStopped) return;
  for (const pkg of packages) {
    let manifest: Manifest | null = null;
    try {
      manifest = readInstalledManifest(pkg.dnpName, pkg.isCore);
    } catch {
      // Reported when the package is staged, which then copies it like any other
    }
    if (!exportsSlashingProtection(ctx, pkg, manifest)) continue;
    const stopped = stoppedKeyServices(pkg);
    if (stopped.length > 0) {
      throw Error(
        `${pkg.dnpName} is not running (${stopped.join(", ")}). It must run so its validator keys can be removed and their slashing protection exported: start it, or create the backup without "I am moving or reinstalling this Dappnode"`
      );
    }
    try {
      await ctx.deps.brainClient(pkg.dnpName).listKeys();
    } catch (e) {
      throw Error(`The Staking Brain of ${pkg.dnpName} is not reachable, nothing was changed: ${e.message}`);
    }
  }
}

/**
 * Web3Signer when moving or reinstalling this node. Its slashing protection
 * lives in Postgres, so instead of copying it:
 * 1. Copy the keystores and the brain DB while it runs: the delete removes
 *    the keystore files
 * 2. Check that the copy restores every key loaded in Web3Signer, or stop
 *    here: a key that is not in it would be lost
 * 3. Delete those keys through the Staking Brain. Web3Signer returns the
 *    EIP-3076 interchange of the deleted keys, exact at that moment, and
 *    this node can no longer sign with them, even if restarted
 * 4. Store the interchange and stop the package
 */
async function stageWeb3signerForMove(
  ctx: StageContext,
  pkg: InstalledPackageData,
  manifest: Manifest | null
): Promise<{ backup: FullBackupItemEntry[]; slashingProtection: FullBackupSlashingProtection }> {
  const backup = await stageBackupItems(ctx.deps, ctx.staging, pkg, manifest, ctx.warnings);
  const failed = backup.filter((item) => !item.file);
  const { keystores, brainDb } = findWeb3signerItems(backup);
  if (failed.length > 0 || !keystores?.file) {
    throw Error(
      `${pkg.dnpName}: could not copy ${failed.map((item) => item.name).join(", ") || "its keystores"}, so its validator keys were not removed. ${failed.map((item) => item.error).join("; ")}`
    );
  }

  const exported: SlashingExport = {
    pkg,
    keystoresTar: ctx.staging.sourcePath(keystores.file),
    keystoresPath: keystores.path,
    brainDbTar: brainDb?.file ? ctx.staging.sourcePath(brainDb.file) : null,
    deleted: [],
    interchange: null,
    restart: null
  };
  ctx.slashingExports.push(exported);

  const client = ctx.deps.brainClient(pkg.dnpName);
  let pubkeys: string[];
  try {
    pubkeys = await listKeysInBackup(client, exported);
  } catch (e) {
    throw Error(
      `${pkg.dnpName}: ${e.message}. Nothing was removed from it: create the backup without "I am moving or reinstalling this Dappnode"`
    );
  }

  let result: Awaited<ReturnType<typeof exportSlashingProtection>>;
  try {
    exported.deleted = pubkeys;
    ctx.progress.step = "exporting";
    result = await exportSlashingProtection(client, pubkeys);
  } catch (e) {
    if (e instanceof SlashingExportError) {
      exported.deleted = e.deletedPubkeys;
      exported.interchange = e.interchange;
    }
    throw Error(`${pkg.dnpName}: ${e.message}`);
  }
  exported.deleted = result.pubkeys;
  exported.interchange = result.interchange;

  const file = result.interchange
    ? ctx.staging.writeJson(`packages/${pkg.dnpName}/slashing-protection.json`, result.interchange)
    : undefined;
  logs.info(
    `Full backup: removed ${result.pubkeys.length} validator keys from ${pkg.dnpName} and exported their slashing protection`
  );
  if (result.withoutHistory.length > 0) {
    ctx.warnings.push(
      `${pkg.dnpName}: Web3Signer had no signing history for ${result.withoutHistory.length} of the removed validator keys (${someOf(result.withoutHistory.map(shortPubkey))}), so the backup holds no slashing protection for them. That is right only if they have never validated`
    );
  }
  if (result.notRemoved.length > 0) {
    ctx.warnings.push(
      `${pkg.dnpName}: ${result.notRemoved.length} validator keys were added to it while the backup was running (${someOf(result.notRemoved.map(shortPubkey))}). They are not in the backup and were not removed from this node`
    );
  }

  // Nothing can sign with the removed keys any more; stop it anyway, like other validators
  try {
    ctx.progress.step = "stopping";
    exported.restart = await ctx.deps.stopForBackup(pkg);
    ctx.stoppedValidators.push(pkg.dnpName);
  } catch (e) {
    ctx.warnings.push(`${pkg.dnpName}: could not be stopped after removing its validator keys: ${e.message}`);
  }

  return {
    backup,
    slashingProtection: { source: "staking-brain", ...(file ? { file } : {}), pubkeys: result.pubkeys }
  };
}

/** What was kept of a Web3Signer's removed keys, for the admin */
function describeRescue(exported: SlashingExport, interchangeSaved: boolean): string {
  const kept = ["keystores", ...(exported.brainDbTar ? ["Staking Brain DB"] : [])];
  if (!exported.interchange) return `${kept.join(" and ")} (their slashing protection was not exported)`;
  if (!interchangeSaved) return `${kept.join(" and ")} (their slashing protection could not be saved)`;
  const covered = interchangePubkeys(exported.interchange);
  const count = exported.deleted.filter((pubkey) => covered.has(pubkey)).length;
  const slashing =
    count === exported.deleted.length
      ? "slashing protection"
      : `the slashing protection of ${count} of them (none was exported for the rest)`;
  return `${kept.join(", ")} and ${slashing}`;
}

/**
 * The backup failed after a Web3Signer's keys were deleted: import them back
 * with their slashing protection so this node is as before. If that fails
 * too, keep the keystores, brain DB and interchange in DNCORE so the keys
 * are not lost; if they cannot be copied there either, the staged copies
 * are the last ones and must stay (`keepStaging`). Returns a message for
 * the error shown to the admin.
 */
async function undoSlashingExport(
  deps: FullBackupDeps,
  exported: SlashingExport
): Promise<{ message: string; keepStaging: boolean }> {
  const { dnpName } = exported.pkg;
  const count = exported.deleted.length;
  try {
    if (exported.restart) await exported.restart();
    const client = deps.brainClient(dnpName);
    await deps.waitForBrain(client);
    const { keystores, settings } = await readBackedUpKeys(exported);
    const missing = exported.deleted.filter((pubkey) => !keystores.has(pubkey));
    // A key reported as duplicate is still loaded: it never left this Web3Signer
    const result = await importKeysThroughBrain(client, {
      keystores: exported.deleted.flatMap((pubkey) => keystores.get(pubkey) ?? []),
      settings,
      interchange: exported.interchange
    });
    const failed = [...result.failed, ...missing.map((pubkey) => `${pubkey}: keystore not found`)];
    if (failed.length > 0) throw Error(failed.join("; "));
    return {
      message: `${dnpName}: its ${count} validator keys were imported back and it was restarted.`,
      keepStaging: false
    };
  } catch (e) {
    const lost = `${dnpName}: ${count} validator keys were removed from it and could not be imported back (${e.message}).`;
    const advice = "import them through the Staking Brain before validating with them again.";
    const saveInterchange = (dir: string): void => {
      if (!exported.interchange) return;
      fs.writeFileSync(path.join(dir, "slashing-protection.json"), JSON.stringify(exported.interchange), {
        mode: 0o600
      });
    };

    const rescueDir = path.join(params.DNCORE_DIR, "full-backup-rescue", `${dnpName}-${Date.now()}`);
    try {
      fs.mkdirSync(rescueDir, { recursive: true, mode: 0o700 });
      fs.copyFileSync(exported.keystoresTar, path.join(rescueDir, "keystores.tar"));
      if (exported.brainDbTar) fs.copyFileSync(exported.brainDbTar, path.join(rescueDir, "brain-db.tar"));
      saveInterchange(rescueDir);
      return {
        message: `${lost} Their ${describeRescue(exported, true)} were kept in DNCORE/full-backup-rescue/${path.basename(rescueDir)}: ${advice}`,
        keepStaging: false
      };
    } catch (copyError) {
      logs.error(`Full backup: could not keep the removed keys of ${dnpName} in ${rescueDir}`, copyError);
      // No incomplete copy next to the complete one. The staged files are
      // now the last copy: they stay where they are
      try {
        fs.rmSync(rescueDir, { recursive: true, force: true });
      } catch {
        // Nothing was written there
      }
      const stagedDir = path.resolve(path.dirname(exported.keystoresTar));
      let interchangeSaved = true;
      try {
        saveInterchange(stagedDir);
      } catch (writeError) {
        interchangeSaved = false;
        logs.error(`Full backup: could not save the slashing protection of ${dnpName}`, writeError);
      }
      return {
        message: `${lost} They could not be copied to DNCORE/full-backup-rescue (${copyError.message}). Their ${describeRescue(exported, interchangeSaved)} were left in ${stagedDir} inside the dappmanager, a temporary folder that a dappmanager update deletes: copy them out of it now, then ${advice}`,
        keepStaging: true
      };
    }
  }
}

/**
 * Copy the package's `backup` paths. Validator packages are gracefully
 * stopped for their own copy, so they cannot sign between the last write of
 * their slashing protection and the copy, then restarted unless the admin is
 * moving this node: then every validator is left stopped, also one that
 * declares no `backup` paths. Other packages are copied while running.
 */
async function stageBackupItemsStopped(
  ctx: StageContext,
  pkg: InstalledPackageData,
  manifest: Manifest | null
): Promise<FullBackupItemEntry[]> {
  const items = manifest?.backup ?? [];
  const validator = isValidatorPackage({ dnpName: pkg.dnpName, backup: items });
  if (validator && ctx.skipValidatorData) {
    // Left out as a whole: restoring keys without their exact slashing
    // protection is what stopping validators for the copy avoids
    if (items.length > 0) ctx.skippedValidators.push(pkg.dnpName);
    return items.map((item) => ({ ...item, error: VALIDATOR_DATA_LEFT_OUT }));
  }
  const keepStopped = validator && ctx.keepValidatorsStopped;
  if (items.length === 0 && !keepStopped) return [];

  // Only validators are time-sensitive: their slashing protection must be
  // exact, so they are stopped for the copy. Other packages are copied live
  let stopped = false;
  let restart: RestartPackage | null = null;
  if (validator && canStopForBackup(pkg)) {
    ctx.progress.step = "stopping";
    try {
      restart = await ctx.deps.stopForBackup(pkg);
      stopped = true;
    } catch (e) {
      ctx.warnings.push(`${pkg.dnpName}: could not be stopped, its data was copied while running: ${e.message}`);
    }
  }

  try {
    ctx.progress.step = "copying";
    return await stageBackupItems(ctx.deps, ctx.staging, pkg, manifest, ctx.warnings);
  } finally {
    if (keepStopped && stopped) {
      ctx.stoppedValidators.push(pkg.dnpName);
      if (restart) ctx.restartOnFailure.push({ dnpName: pkg.dnpName, restart });
    } else if (keepStopped) {
      ctx.warnings.push(
        `${pkg.dnpName}: was NOT left stopped. Stop it from its page before you run its validators on another node`
      );
    } else if (restart) {
      ctx.progress.step = "restarting";
      try {
        await restart();
      } catch (e) {
        ctx.warnings.push(
          `${pkg.dnpName}: could not be restarted after the backup, start it from its page: ${e.message}`
        );
      }
    }
  }
}

/**
 * The backup failed, so there is nothing to move to another node: start
 * again the validators it left stopped. Returns the ones that did not start
 */
async function restartStoppedValidators(ctx: StageContext): Promise<string[]> {
  const notStarted: string[] = [];
  for (const { dnpName, restart } of ctx.restartOnFailure) {
    try {
      await restart();
    } catch (e) {
      logs.error(`Full backup: could not restart ${dnpName} after a failed backup`, e);
      notStarted.push(dnpName);
    }
  }
  return notStarted;
}

async function stageHttpsMappings(
  deps: FullBackupDeps,
  staging: Staging,
  warnings: string[]
): Promise<string | undefined> {
  try {
    return staging.writeJson("dappmanager/https-mappings.json", await deps.getHttpsMappings());
  } catch (e) {
    warnings.push(`Could not read HTTPS mappings: ${e.message}`);
    return undefined;
  }
}

/**
 * The staged files are written a second time into the archive, so the disk
 * must hold them twice and still keep MIN_FREE_DISK_BYTES free
 */
async function assertFreeDiskSpace(dir: string, stagedBytes = 0): Promise<void> {
  const stats = await fs.promises.statfs(dir);
  const free = stats.bavail * stats.bsize;
  const needed = stagedBytes + MIN_FREE_DISK_BYTES;
  if (free < needed) {
    const mib = (bytes: number): number => Math.floor(bytes / 1024 / 1024);
    throw new DiskSpaceError(
      `Not enough free disk space to create a backup: ${mib(free)} MiB available, ${mib(needed)} MiB needed`
    );
  }
}

/** Marks a staging dir that holds the last copy of validator keys removed from this node */
const KEPT_STAGING_MARKER = "KEEP-removed-validator-keys";

/**
 * Remove what earlier backups left behind if the dappmanager restarted before
 * their cleanup: staging dirs, and files whose download link has expired.
 * Never a staging dir kept because it holds the last copy of removed keys
 */
function removeStaleFiles(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    const stats = fs.statSync(entryPath, { throwIfNoEntry: false });
    if (!stats) continue;
    if (entry.isDirectory() && fs.existsSync(path.join(entryPath, KEPT_STAGING_MARKER))) continue;
    if (entry.isDirectory() || Date.now() - stats.mtimeMs > TEMP_TRANSFER_TTL_MS) {
      fs.rmSync(entryPath, { recursive: true, force: true });
    }
  }
}

async function writeArchive(
  outPath: string,
  manifest: FullBackupManifest,
  staging: Staging,
  password: string,
  encryptOptions?: EncryptOptions,
  /** Called with the size of each chunk of staged data written into the archive */
  onArchived: (bytes: number) => void = () => undefined
): Promise<void> {
  const pack = tar.pack();
  const encrypt = await createEncryptStream(password, encryptOptions);
  const written = pipeline(pack, zlib.createGzip(), encrypt, fs.createWriteStream(outPath, { mode: 0o600 }));
  // If the output side fails, pending entries would wait forever: race them
  const outputFailed = written.then(() => {
    throw Error("Backup output closed unexpectedly");
  });
  outputFailed.catch(() => undefined);
  const step = (promise: Promise<void>): Promise<void> => Promise.race([promise, outputFailed]);

  const mtime = new Date(manifest.createdAt);
  const addBuffer = (name: string, data: Buffer): Promise<void> =>
    new Promise((resolve, reject) =>
      pack.entry({ name, mode: 0o600, mtime }, data, (err) => (err ? reject(err) : resolve()))
    );
  const addFile = (name: string, sourcePath: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const { size } = fs.statSync(sourcePath);
      const entry = pack.entry({ name, size, mode: 0o600, mtime }, (err) => (err ? reject(err) : resolve()));
      const source = fs.createReadStream(sourcePath);
      source.on("error", reject);
      source.on("data", (chunk) => onArchived(chunk.length));
      source.pipe(entry);
    });

  try {
    await step(addBuffer(MANIFEST_ARCHIVE_PATH, Buffer.from(JSON.stringify(manifest, null, 2))));
    for (const { archivePath, sourcePath } of staging.files) await step(addFile(archivePath, sourcePath));
    pack.finalize();
    await written;
  } catch (e) {
    pack.destroy();
    await written.catch(() => undefined);
    throw e;
  }
}

/** dappnode-backup-2026-11-23T10-15-00Z-1a2b.dnbackup, unique per backup */
function backupFileName(date: Date, id: string): string {
  const timestamp = date
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z")
    .replace(/:/g, "-");
  return `dappnode-backup-${timestamp}-${id.slice(0, 4)}.dnbackup`;
}

/**
 * Write an encrypted full backup of this DAppNode to `outDir`: dappmanager
 * settings, identity, admin credentials and every installed package's files,
 * user settings and manifest-declared `backup` data. Volumes are not included.
 */
export async function writeFullBackup({
  password,
  outDir,
  keepValidatorsStopped = false,
  pendingDir,
  skipValidatorData = false,
  encryptOptions,
  deps = defaultDeps
}: {
  password: string;
  outDir: string;
  /** The admin is moving or reinstalling this node: leave validators stopped */
  keepValidatorsStopped?: boolean;
  /**
   * Where to keep a copy of a backup that removed validator keys from this
   * node, until the admin discards it. If it cannot be kept, the backup
   * fails and the keys are imported back
   */
  pendingDir?: string;
  /**
   * Do not interrupt validators: leave their keys and slashing protection
   * out of the backup, which then only restores their settings
   */
  skipValidatorData?: boolean;
  /** For tests only: cheaper KDF parameters */
  encryptOptions?: EncryptOptions;
  deps?: FullBackupDeps;
}): Promise<{
  filePath: string;
  fileName: string;
  sizeBytes: number;
  warnings: string[];
  stoppedValidators: string[];
  slashingProtectionExported: FullBackupCreateResult["slashingProtectionExported"];
  skippedValidators: string[];
}> {
  validateBackupPassword(password);
  if (keepValidatorsStopped && skipValidatorData) {
    throw Error("Validators cannot be both left out of the backup and kept stopped");
  }
  if (backupInProgress) throw Error("A backup is already being created");
  backupInProgress = true;

  const id = crypto.randomBytes(8).toString("hex");
  const createdAt = new Date();
  const progress: FullBackupProgress = {
    step: "preparing",
    startedAt: createdAt.toISOString(),
    packagesDone: 0,
    packagesTotal: 0,
    copiedBytes: 0,
    archivedBytes: 0,
    archiveTotalBytes: 0
  };
  currentProgress = progress;
  const staging = new Staging(path.join(params.FULL_BACKUP_DIR, `full-backup-${id}`), (bytes) => {
    progress.copiedBytes += bytes;
  });
  // The download route names the file after its basename
  const fileName = backupFileName(createdAt, id);
  const outPath = path.join(outDir, fileName);
  const ctx: StageContext = {
    deps,
    staging,
    warnings: [],
    keepValidatorsStopped,
    skipValidatorData,
    stoppedValidators: [],
    skippedValidators: [],
    restartOnFailure: [],
    slashingExports: [],
    progress
  };
  let keepStaging = false;

  try {
    // Staged in FULL_BACKUP_DIR whatever `outDir` is. Only that dir is swept: `outDir` can hold other files
    fs.mkdirSync(params.FULL_BACKUP_DIR, { recursive: true, mode: 0o700 });
    removeStaleFiles(params.FULL_BACKUP_DIR);
    fs.mkdirSync(outDir, { recursive: true, mode: 0o700 });
    await assertFreeDiskSpace(params.FULL_BACKUP_DIR);
    await assertFreeDiskSpace(outDir);
    fs.mkdirSync(staging.dir, { recursive: true, mode: 0o700 });

    const { warnings } = ctx;
    const installed = await deps.listPackages();
    await checkWeb3signersCanExport(ctx, installed);
    const dappmanagerFiles = stageDappmanagerFiles(staging);
    dappmanagerFiles.httpsMappings = await stageHttpsMappings(deps, staging, warnings);

    const packages: FullBackupPackageEntry[] = [];
    progress.packagesTotal = installed.length;
    for (const pkg of installed) {
      progress.step = "copying";
      progress.dnpName = pkg.dnpName;
      const entry = await stagePackage(ctx, pkg);
      if (entry) packages.push(entry);
      progress.packagesDone++;
    }
    progress.dnpName = undefined;
    packages.sort((a, b) => a.dnpName.localeCompare(b.dnpName));

    const manifest: FullBackupManifest = {
      formatVersion: 1,
      createdAt: createdAt.toISOString(),
      dappmanager: getVersionData().data,
      arch: process.arch,
      dappmanagerFiles,
      packages
    };

    progress.step = "archiving";
    progress.archiveTotalBytes = staging.files.reduce((total, file) => total + fs.statSync(file.sourcePath).size, 0);
    await writeArchive(outPath, manifest, staging, password, encryptOptions, (bytes) => {
      progress.archivedBytes += bytes;
    });

    const { size } = fs.statSync(outPath);
    logs.info(`Full backup written: ${packages.length} packages, ${size} bytes, ${warnings.length} warnings`);
    const slashingProtectionExported = packages.flatMap((pkg) =>
      pkg.slashingProtection ? [{ dnpName: pkg.dnpName, validatorCount: pkg.slashingProtection.pubkeys.length }] : []
    );
    // This file is now the only copy of the removed keys and their slashing
    // protection: keep it on the node, the download can fail or come late
    if (pendingDir && ctx.slashingExports.some((exported) => exported.deleted.length > 0)) {
      keepPendingBackup(pendingDir, outPath, {
        fileName,
        sizeBytes: size,
        createdAt: manifest.createdAt,
        slashingProtectionExported
      });
    }
    return {
      filePath: outPath,
      fileName,
      sizeBytes: size,
      warnings,
      stoppedValidators: ctx.stoppedValidators,
      slashingProtectionExported,
      skippedValidators: ctx.skippedValidators
    };
  } catch (e) {
    fs.rmSync(outPath, { force: true });
    const removed = ctx.slashingExports.filter((exported) => exported.deleted.length > 0);
    // Until each undo has put the keys somewhere else, the staged copies may be the last ones
    keepStaging = removed.length > 0;
    const undone: Awaited<ReturnType<typeof undoSlashingExport>>[] = [];
    for (const exported of removed) undone.push(await undoSlashingExport(deps, exported));
    keepStaging = undone.some((undo) => undo.keepStaging);
    const notStarted = await restartStoppedValidators(ctx);
    const details = [
      ...undone.map((undo) => undo.message),
      ...(notStarted.length > 0
        ? [
            `These validators were stopped for the backup and could not be started again, start them from their page: ${notStarted.join(", ")}`
          ]
        : [])
    ];
    throw details.length > 0 ? Error(`${e.message}. ${details.join(" ")}`) : e;
  } finally {
    if (keepStaging) {
      // The next backup sweeps this folder: mark the dir so it is left alone
      try {
        fs.writeFileSync(path.join(staging.dir, KEPT_STAGING_MARKER), "", { mode: 0o600 });
      } catch (markError) {
        logs.error(`Full backup: could not mark ${staging.dir} to be kept`, markError);
      }
    } else {
      fs.rmSync(staging.dir, { recursive: true, force: true });
    }
    currentProgress = undefined;
    backupInProgress = false;
  }
}

/**
 * Create a full backup and register it for download through /download/:fileId
 */
export async function createFullBackup(args: {
  password: string;
  keepValidatorsStopped?: boolean;
  skipValidatorData?: boolean;
  encryptOptions?: EncryptOptions;
  deps?: FullBackupDeps;
}): Promise<FullBackupCreateResult> {
  validateBackupPassword(args.password);
  if (backupInProgress) throw Error("A backup is already being created");
  // Only backups made for download are reported by getFullBackupStatus, not the snapshot a restore takes
  lastBackup = undefined;
  try {
    const { filePath, ...written } = await writeFullBackup({
      ...args,
      outDir: params.FULL_BACKUP_DIR,
      pendingDir: getPendingBackupDir()
    });
    const fileId = createFileTransferId();
    registerTempTransferFile(fileId, filePath);
    const result = { fileId, ...written };
    lastBackup = { finishedAt: new Date().toISOString(), result };
    return result;
  } catch (e) {
    lastBackup = { finishedAt: new Date().toISOString(), error: e.message };
    throw e;
  }
}
