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
  FullBackupStatus,
  InstalledPackageData,
  Manifest
} from "@dappnode/types";
import { getVersionData } from "../utils/getVersionData.js";
import { createFileTransferId, registerTempTransferFile, TEMP_TRANSFER_TTL_MS } from "../uploads/tempTransfer.js";
import { createEncryptStream, EncryptOptions } from "./format.js";
import { cacheDbIncludedKeys, mainDbIncludedKeys, nexusDbIncludedKeys, pickKeys } from "./dbKeys.js";
import { getCoverage, getNamedVolumes, isValidatorPackage, readInstalledManifest } from "./coverage.js";
import { canStopForBackup, RestartPackage, stopPackageForBackup } from "./packageStop.js";

export const FULL_BACKUP_PASSWORD_MIN_LENGTH = 10;
const FULL_BACKUP_PASSWORD_MAX_LENGTH = 1024;
const MIN_FREE_DISK_BYTES = 1024 * 1024 * 1024;
const DISK_SPACE_CHECK_INTERVAL_BYTES = 64 * 1024 * 1024;
export const MANIFEST_ARCHIVE_PATH = "backup-manifest.json";

/** Names used as archive path segments: no separators, no dot-only names */
const SAFE_SEGMENT = /^(?!\.{1,2}$)[A-Za-z0-9._-]{1,200}$/;

let backupInProgress = false;
/** How the last backup ended, for a UI that lost the response of its request */
let lastBackup: FullBackupStatus["last"];

export function getFullBackupStatus(): FullBackupStatus {
  // The file of the last backup is deleted when its download link expires
  const expired = lastBackup && Date.now() - Date.parse(lastBackup.finishedAt) > TEMP_TRANSFER_TTL_MS;
  return { inProgress: backupInProgress, ...(lastBackup && !expired ? { last: lastBackup } : {}) };
}

/** External effects, injectable for tests */
export interface FullBackupDeps {
  listPackages: () => Promise<InstalledPackageData[]>;
  getArchive: (containerName: string, path: string) => Promise<NodeJS.ReadableStream>;
  getHttpsMappings: () => Promise<FullBackupHttpsMappings>;
  /** Gracefully stop a package before copying its data; returns how to restart it */
  stopForBackup: (pkg: InstalledPackageData) => Promise<RestartPackage | null>;
}

const defaultDeps: FullBackupDeps = {
  listPackages,
  getArchive: dockerGetArchive,
  getHttpsMappings: () => httpsPortal.getMappings(),
  stopForBackup: stopPackageForBackup
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
  stoppedValidators: string[];
  /** How to start again the validators this backup left stopped, if it fails */
  restartOnFailure: { dnpName: string; restart: RestartPackage }[];
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

  constructor(readonly dir: string) {}

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
    backup: await stageBackupItemsStopped(ctx, pkg, manifest)
  };
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
  const keepStopped = validator && ctx.keepValidatorsStopped;
  if (items.length === 0 && !keepStopped) return [];

  // Only validators are time-sensitive: their slashing protection must be
  // exact, so they are stopped for the copy. Other packages are copied live
  let stopped = false;
  let restart: RestartPackage | null = null;
  if (validator && canStopForBackup(pkg)) {
    try {
      restart = await ctx.deps.stopForBackup(pkg);
      stopped = true;
    } catch (e) {
      ctx.warnings.push(`${pkg.dnpName}: could not be stopped, its data was copied while running: ${e.message}`);
    }
  }

  try {
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

/**
 * Remove what earlier backups left behind if the dappmanager restarted before
 * their cleanup: staging dirs, and files whose download link has expired
 */
function removeStaleFiles(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    const stats = fs.statSync(entryPath, { throwIfNoEntry: false });
    if (!stats) continue;
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
  encryptOptions?: EncryptOptions
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
 * Create an encrypted full backup of this DAppNode: dappmanager settings,
 * identity, admin credentials and every installed package's files, user
 * settings and manifest-declared `backup` data. Volumes are not included.
 * The result is registered for download through /download/:fileId.
 */
export async function createFullBackup({
  password,
  keepValidatorsStopped = false,
  encryptOptions,
  deps = defaultDeps
}: {
  password: string;
  /** The admin is moving or reinstalling this node: leave validators stopped */
  keepValidatorsStopped?: boolean;
  /** For tests only: cheaper KDF parameters */
  encryptOptions?: EncryptOptions;
  deps?: FullBackupDeps;
}): Promise<FullBackupCreateResult> {
  validateBackupPassword(password);
  if (backupInProgress) throw Error("A backup is already being created");
  backupInProgress = true;
  lastBackup = undefined;

  const id = crypto.randomBytes(8).toString("hex");
  const staging = new Staging(path.join(params.FULL_BACKUP_DIR, `full-backup-${id}`));
  const createdAt = new Date();
  // The download route names the file after its basename
  const fileName = backupFileName(createdAt, id);
  const outPath = path.join(params.FULL_BACKUP_DIR, fileName);
  const ctx: StageContext = {
    deps,
    staging,
    warnings: [],
    keepValidatorsStopped,
    stoppedValidators: [],
    restartOnFailure: []
  };

  try {
    fs.mkdirSync(params.FULL_BACKUP_DIR, { recursive: true, mode: 0o700 });
    removeStaleFiles(params.FULL_BACKUP_DIR);
    await assertFreeDiskSpace(params.FULL_BACKUP_DIR);
    fs.mkdirSync(staging.dir, { recursive: true, mode: 0o700 });

    const { warnings } = ctx;
    const dappmanagerFiles = stageDappmanagerFiles(staging);
    dappmanagerFiles.httpsMappings = await stageHttpsMappings(deps, staging, warnings);

    const packages: FullBackupPackageEntry[] = [];
    for (const pkg of await deps.listPackages()) {
      const entry = await stagePackage(ctx, pkg);
      if (entry) packages.push(entry);
    }
    packages.sort((a, b) => a.dnpName.localeCompare(b.dnpName));

    const manifest: FullBackupManifest = {
      formatVersion: 1,
      createdAt: createdAt.toISOString(),
      dappmanager: getVersionData().data,
      arch: process.arch,
      dappmanagerFiles,
      packages
    };

    await writeArchive(outPath, manifest, staging, password, encryptOptions);

    const fileId = createFileTransferId();
    registerTempTransferFile(fileId, outPath);

    const { size } = fs.statSync(outPath);
    logs.info(`Full backup created: ${packages.length} packages, ${size} bytes, ${warnings.length} warnings`);
    const result = { fileId, fileName, sizeBytes: size, warnings, stoppedValidators: ctx.stoppedValidators };
    lastBackup = { finishedAt: new Date().toISOString(), result };
    return result;
  } catch (e) {
    fs.rmSync(outPath, { force: true });
    const notStarted = await restartStoppedValidators(ctx);
    const error =
      notStarted.length > 0
        ? Error(
            `${e.message}. These validators were stopped for the backup and could not be started again, start them from their page: ${notStarted.join(", ")}`
          )
        : e;
    lastBackup = { finishedAt: new Date().toISOString(), error: error.message };
    throw error;
  } finally {
    fs.rmSync(staging.dir, { recursive: true, force: true });
    backupInProgress = false;
  }
}
