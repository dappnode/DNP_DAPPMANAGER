import fs from "fs";
import path from "path";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";
import {
  FullBackupHttpsMappings,
  FullBackupManifest,
  FullBackupPackageEntry,
  FullBackupRestoreMode,
  FullBackupRestorePackagePlan,
  FullBackupRestoreStatus,
  FullBackupRestoreStep,
  InstalledPackageData,
  Manifest,
  UserSettings
} from "@dappnode/types";
import { mainDbIncludedKeys, cacheDbIncludedKeys, nexusDbIncludedKeys, pickKeys } from "./dbKeys.js";
import { planRestore } from "./plan.js";
import { extractBackup, extractedFilePath, readExtractedJson } from "./read.js";
import { validateBackupPassword } from "./create.js";

const AUTO_UPDATE_SETTINGS_KEY = "auto-update-settings";

/** External effects of a restore, injectable for tests */
export interface RestoreDeps {
  listPackages: () => Promise<InstalledPackageData[]>;
  /**
   * packageInstall of one package at an exact version with its user settings.
   * `origin` is the IPFS hash it was installed from, if any, to fall back to
   * when the version is no longer in the registry
   */
  installPackage: (args: {
    dnpName: string;
    version: string;
    origin?: string;
    userSettings: UserSettings;
  }) => Promise<void>;
  /** Rewrite an installed package's compose with these settings and recreate it */
  applySettings: (args: { dnpName: string; isCore: boolean; userSettings: UserSettings }) => Promise<void>;
  removePackage: (dnpName: string) => Promise<void>;
  putArchive: (containerName: string, dirPath: string, tarFilePath: string) => Promise<void>;
  stopContainer: (containerName: string) => Promise<void>;
  startContainer: (containerName: string) => Promise<void>;
  getHttpsMappings: () => Promise<FullBackupHttpsMappings>;
  addHttpsMapping: (mapping: FullBackupHttpsMappings[number]) => Promise<void>;
  /** Encrypted backup of this node, returns its path */
  writeSafetySnapshot: (password: string) => Promise<string>;
  /** Current values of the global envs, prefixed with _DAPPNODE_GLOBAL_ */
  getGlobalEnvs: () => Record<string, unknown>;
  refreshGlobalEnvFile: () => void;
  progress: (dnpName: string, message: string) => void;
}

interface RestoreJob extends FullBackupRestoreStatus {
  status: "running" | "done" | "failed";
  mode: FullBackupRestoreMode;
  /** Auto-update settings before the restore paused them */
  previousAutoUpdateSettings: unknown;
}

export function getRestoreDir(): string {
  return path.join(params.DNCORE_DIR, "full-backup-restore");
}
const jobPath = (): string => path.join(getRestoreDir(), "job.json");
const extractDir = (): string => path.join(getRestoreDir(), "extracted");

let runningJob: Promise<void> | null = null;

function readJob(): RestoreJob | null {
  try {
    return JSON.parse(fs.readFileSync(jobPath(), "utf8"));
  } catch {
    return null;
  }
}

function saveJob(job: RestoreJob): void {
  fs.mkdirSync(getRestoreDir(), { recursive: true, mode: 0o700 });
  const tmp = `${jobPath()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(job, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, jobPath());
}

export function getRestoreStatus(): FullBackupRestoreStatus {
  const job = readJob();
  if (!job) return { status: "idle", steps: [], warnings: [], stoppedValidators: [] };
  const { previousAutoUpdateSettings: _omit, ...status } = job;
  return status;
}

/** Resolves when the restore running in this process finishes. For tests */
export async function waitForRestoreJob(): Promise<void> {
  await runningJob;
}

export function isRestoreRunning(): boolean {
  return runningJob !== null || readJob()?.status === "running";
}

/** Decrypted backup content must not stay on disk once the job ends */
function cleanupExtracted(): void {
  fs.rmSync(extractDir(), { recursive: true, force: true });
}

// Package order
// =============

function readPackageManifest(dir: string, pkg: FullBackupPackageEntry): Manifest | null {
  return readExtractedJson<Manifest | null>(dir, pkg.files.manifest, null);
}

/**
 * Removals first, then system packages, then the rest with dependencies
 * before dependants, so that packageInstall does not pull a dependency at
 * its latest version before its own restore step installs the backup's one
 */
export function orderPackageSteps(
  plans: FullBackupRestorePackagePlan[],
  dependenciesOf: (dnpName: string) => string[]
): FullBackupRestorePackagePlan[] {
  const active = plans.filter((p) => p.action !== "skip");
  const byName = new Map(active.map((p) => [p.dnpName, p]));
  const ordered: FullBackupRestorePackagePlan[] = [];
  const visited = new Set<string>();

  const visit = (plan: FullBackupRestorePackagePlan, stack: Set<string>): void => {
    if (visited.has(plan.dnpName) || stack.has(plan.dnpName)) return;
    stack.add(plan.dnpName);
    for (const dep of dependenciesOf(plan.dnpName)) {
      const depPlan = byName.get(dep);
      if (depPlan && depPlan.action !== "remove") visit(depPlan, stack);
    }
    stack.delete(plan.dnpName);
    visited.add(plan.dnpName);
    ordered.push(plan);
  };

  const groups = [
    active.filter((p) => p.action === "remove"),
    active.filter((p) => p.action !== "remove" && p.isCore),
    active.filter((p) => p.action !== "remove" && !p.isCore)
  ];
  for (const group of groups) {
    for (const plan of [...group].sort((a, b) => a.dnpName.localeCompare(b.dnpName))) visit(plan, new Set());
  }
  return ordered;
}

// Settings
// ========

/**
 * Package composes keep the global env values injected at install time.
 * Replace them with this node's current values, so a clone does not bring
 * back the old machine's IP or domain, and merge keeps this node's
 */
export function withCurrentGlobalEnvs(userSettings: UserSettings, globalEnvs: Record<string, unknown>): UserSettings {
  if (!userSettings.environment) return userSettings;
  const environment: NonNullable<UserSettings["environment"]> = {};
  for (const [service, envs] of Object.entries(userSettings.environment)) {
    environment[service] = { ...envs };
    for (const key of Object.keys(envs)) {
      const value = globalEnvs[key];
      if (key.startsWith(params.GLOBAL_ENVS_PREFIX) && value !== undefined && value !== null) {
        environment[service][key] = String(value);
      }
    }
  }
  return { ...userSettings, environment };
}

const stakerKeys = Object.entries(mainDbIncludedKeys)
  .filter(([, category]) => category === "staker")
  .map(([key]) => key);

function isEmptySelection(value: unknown): boolean {
  return value === undefined || value === null || value === false || value === "";
}

// Job
// ===

function step(id: string, title: string): FullBackupRestoreStep {
  return { id, title, status: "pending" };
}

const actionTitles: Record<string, string> = {
  install: "Install",
  update: "Update",
  "apply-settings": "Configure",
  "keep-newer": "Configure",
  remove: "Remove"
};

/**
 * Validate the password and the whole file, then start the restore in the
 * background. Throws before changing anything if the password is wrong, the
 * file is corrupted, or a restore is already running.
 */
export async function startRestore({
  filePath,
  password,
  mode,
  confirmValidatorsOff,
  deps
}: {
  filePath: string;
  password: string;
  mode: FullBackupRestoreMode;
  confirmValidatorsOff: boolean;
  deps: RestoreDeps;
}): Promise<void> {
  validateBackupPassword(password);
  if (mode !== "merge" && mode !== "clone") throw Error(`Unknown restore mode ${mode}`);
  if (isRestoreRunning()) throw Error("A restore is already running");

  cleanupExtracted();
  fs.mkdirSync(getRestoreDir(), { recursive: true, mode: 0o700 });
  let manifest: FullBackupManifest;
  try {
    manifest = await extractBackup(filePath, password, extractDir());
  } catch (e) {
    cleanupExtracted();
    throw e;
  }

  const installed = (await deps.listPackages()).map((p) => ({
    dnpName: p.dnpName,
    version: p.version,
    isCore: p.isCore
  }));
  const plan = planRestore({ manifest, installed, mode });
  if (!confirmValidatorsOff && plan.packages.some((p) => p.validator && p.action !== "skip" && p.action !== "remove")) {
    cleanupExtracted();
    throw Error("This backup contains validator keys: confirm that the old node is switched off");
  }

  const manifests = new Map(manifest.packages.map((p) => [p.dnpName, readPackageManifest(extractDir(), p)]));
  const packageSteps = orderPackageSteps(plan.packages, (dnpName) =>
    Object.keys(manifests.get(dnpName)?.dependencies ?? {})
  );

  const job: RestoreJob = {
    status: "running",
    mode,
    startedAt: new Date().toISOString(),
    warnings: [...plan.warnings],
    stoppedValidators: [],
    previousAutoUpdateSettings: db.readMainDbRaw()[AUTO_UPDATE_SETTINGS_KEY] ?? {},
    steps: [
      { id: "extract", title: "Decrypt and verify backup", status: "done" },
      step("snapshot", "Back up this node first"),
      step("pause-auto-updates", "Pause auto-updates"),
      step(
        "dappmanager-settings",
        mode === "clone" ? "Restore dappmanager settings and identity" : "Restore staker selections"
      ),
      ...packageSteps.map((p) => step(`package:${p.dnpName}`, `${actionTitles[p.action]} ${p.dnpName}`)),
      step("https-mappings", "Restore HTTPS mappings"),
      step("finish", "Resume auto-updates"),
      // Last: afterwards this session may need to log in with the old password
      ...(mode === "clone" ? [step("admin-login", "Restore admin login")] : [])
    ]
  };
  saveJob(job);

  runningJob = runJob(job, deps, password).finally(() => {
    runningJob = null;
  });
}

/**
 * Continue a restore interrupted by a dappmanager restart. The password is
 * never stored, so a restore interrupted before its safety snapshot is
 * aborted: nothing on the node had been changed yet.
 */
export function resumeRestoreIfInterrupted(deps: RestoreDeps): void {
  const job = readJob();
  if (!job || job.status !== "running" || runningJob) return;
  const snapshot = job.steps.find((s) => s.id === "snapshot");
  if (snapshot?.status !== "done") {
    if (snapshot) Object.assign(snapshot, { status: "failed", error: "Interrupted before anything was changed" });
    job.status = "failed";
    job.finishedAt = new Date().toISOString();
    saveJob(job);
    cleanupExtracted();
    return;
  }
  logs.info("Resuming interrupted full backup restore");
  runningJob = runJob(job, deps, null).finally(() => {
    runningJob = null;
  });
}

async function runJob(job: RestoreJob, deps: RestoreDeps, password: string | null): Promise<void> {
  const manifest = readExtractedJson<FullBackupManifest | null>(extractDir(), "backup-manifest.json", null);
  try {
    if (!manifest) throw Error("Extracted backup is missing, upload the file again");
    const context = new RestoreContext(job, deps, manifest, password);

    for (const current of job.steps) {
      if (current.status === "done" || current.status === "skipped") continue;
      current.status = "running";
      delete current.error;
      saveJob(job);
      deps.progress(current.id.replace(/^package:/, ""), current.title);
      try {
        await context.run(current);
        current.status = "done";
      } catch (e) {
        current.status = "failed";
        current.error = e.message;
        logs.error(`Full backup restore step ${current.id} failed`, e);
        // Without a snapshot or the dappmanager settings nothing else is safe to do
        if (current.id === "snapshot" || current.id === "dappmanager-settings") {
          job.steps.filter((s) => s.status === "pending").forEach((s) => (s.status = "skipped"));
          if (current.id === "dappmanager-settings") await context.resumeAutoUpdates();
          throw e;
        }
      }
      saveJob(job);
    }
    job.status = job.steps.some((s) => s.status === "failed") ? "failed" : "done";
  } catch (e) {
    job.status = "failed";
    if (!job.steps.some((s) => s.status === "failed")) job.warnings.push(`Restore aborted: ${e.message}`);
  } finally {
    job.finishedAt = new Date().toISOString();
    saveJob(job);
    cleanupExtracted();
  }
}

class RestoreContext {
  private readonly dir = extractDir();
  private readonly backupMainDb: Record<string, unknown>;

  constructor(
    private readonly job: RestoreJob,
    private readonly deps: RestoreDeps,
    private readonly manifest: FullBackupManifest,
    private readonly password: string | null
  ) {
    this.backupMainDb = readExtractedJson(this.dir, manifest.dappmanagerFiles.mainDb, {});
  }

  async run(current: FullBackupRestoreStep): Promise<void> {
    if (current.id.startsWith("package:")) return this.restorePackage(current.id.slice("package:".length));
    switch (current.id) {
      case "snapshot":
        return this.snapshot();
      case "pause-auto-updates":
        return this.pauseAutoUpdates();
      case "dappmanager-settings":
        return this.restoreDappmanagerSettings();
      case "https-mappings":
        return this.restoreHttpsMappings();
      case "admin-login":
        return this.restoreAdminLogin();
      case "finish":
        return this.resumeAutoUpdates();
      default:
        throw Error(`Unknown restore step ${current.id}`);
    }
  }

  private async snapshot(): Promise<void> {
    if (!this.password) throw Error("Interrupted before the safety snapshot was taken");
    this.job.safetySnapshot = await this.deps.writeSafetySnapshot(this.password);
  }

  private pauseAutoUpdates(): void {
    const current = (this.job.previousAutoUpdateSettings ?? {}) as Record<string, { enabled?: boolean }>;
    const paused: Record<string, { enabled: boolean }> = {
      "system-packages": { enabled: false },
      "my-packages": { enabled: false }
    };
    // Per-package settings override "my-packages", so disable them too
    for (const id of Object.keys(current)) paused[id] = { ...current[id], enabled: false };
    db.writeMainDbKeysRaw({ [AUTO_UPDATE_SETTINGS_KEY]: paused });
  }

  async resumeAutoUpdates(): Promise<void> {
    const settings =
      this.job.mode === "clone" && AUTO_UPDATE_SETTINGS_KEY in this.backupMainDb
        ? this.backupMainDb[AUTO_UPDATE_SETTINGS_KEY]
        : this.job.previousAutoUpdateSettings;
    db.writeMainDbKeysRaw({ [AUTO_UPDATE_SETTINGS_KEY]: settings ?? {} });
    this.deps.refreshGlobalEnvFile();
  }

  private restoreDappmanagerSettings(): void {
    const restoredNames = new Set(this.planFor().map((p) => p.dnpName));
    if (this.job.mode === "clone") {
      // Auto-updates stay paused until the last step
      const { [AUTO_UPDATE_SETTINGS_KEY]: _later, ...mainDb } = pickKeys(this.backupMainDb, mainDbIncludedKeys);
      db.writeMainDbKeysRaw(mainDb);
      const cacheDb = readExtractedJson(this.dir, this.manifest.dappmanagerFiles.cacheDb, {});
      db.writeCacheDbKeysRaw(pickKeys(cacheDb, cacheDbIncludedKeys));
      const nexusDb = readExtractedJson<Record<string, unknown>>(this.dir, this.manifest.dappmanagerFiles.nexusDb, {});
      const history = (pickKeys(nexusDb, nexusDbIncludedKeys)["nexus-chat-history"] ?? {}) as object;
      const currentHistory = (db.readNexusDbRaw()["nexus-chat-history"] ?? {}) as object;
      db.writeNexusDbKeysRaw({ "nexus-chat-history": { ...currentHistory, ...history } });
    } else {
      // Merge: take a staker selection only where this node has none and the
      // selected package is restored, never replace this node's choice
      const current = db.readMainDbRaw();
      const values: Record<string, unknown> = {};
      for (const key of stakerKeys) {
        const value = this.backupMainDb[key];
        if (!(key in this.backupMainDb) || isEmptySelection(value)) continue;
        if (!isEmptySelection(current[key])) continue;
        if (typeof value === "string" && !restoredNames.has(value)) continue;
        values[key] = value;
      }
      db.writeMainDbKeysRaw(values);
    }
    this.deps.refreshGlobalEnvFile();
  }

  /** Packages whose staker role conflicts with this node's own selection */
  private stakerConflicts(): Set<string> {
    const conflicts = new Set<string>();
    if (this.job.mode === "clone") return conflicts;
    const current = db.readMainDbRaw();
    for (const key of stakerKeys) {
      const backupValue = this.backupMainDb[key];
      if (typeof backupValue === "string" && backupValue && current[key] !== backupValue) conflicts.add(backupValue);
    }
    return conflicts;
  }

  private planFor(): FullBackupRestorePackagePlan[] {
    return planRestore({ manifest: this.manifest, installed: [], mode: this.job.mode }).packages;
  }

  private async restorePackage(dnpName: string): Promise<void> {
    const installedPackages = await this.deps.listPackages();
    const installed = installedPackages.find((p) => p.dnpName === dnpName);
    const plan = planRestore({
      manifest: this.manifest,
      installed: installedPackages.map((p) => ({ dnpName: p.dnpName, version: p.version, isCore: p.isCore })),
      mode: this.job.mode
    }).packages.find((p) => p.dnpName === dnpName);
    if (!plan || plan.action === "skip") return;

    if (plan.action === "remove") {
      await this.deps.removePackage(dnpName);
      return;
    }

    const entry = this.manifest.packages.find((p) => p.dnpName === dnpName);
    if (!entry) throw Error(`${dnpName} is not in the backup`);
    let userSettings = withCurrentGlobalEnvs(
      readExtractedJson<UserSettings>(this.dir, entry.files.userSettings, {}),
      this.deps.getGlobalEnvs()
    );
    // System packages may carry hardcoded IPs from another network range
    if (entry.isCore) userSettings = { ...userSettings, networks: undefined };
    if (this.stakerConflicts().has(dnpName) && userSettings.networks) {
      userSettings = { ...userSettings, networks: undefined };
      this.job.warnings.push(
        `${dnpName}: this node already uses another client for the same staker network, so it is restored without its staker role`
      );
    }

    if (plan.action === "install" || plan.action === "update") {
      await this.deps.installPackage({ dnpName, version: entry.version, origin: entry.origin, userSettings });
    } else if (installed) {
      await this.deps.applySettings({ dnpName, isCore: entry.isCore, userSettings });
    }

    if (plan.restoreData) await this.restorePackageData(entry, plan.validator);
    // A validator installed without data stays stopped too; one already
    // running on this node whose data is kept is left as it is
    else if (plan.validator && plan.action === "install") await this.stopPackage(dnpName);
  }

  private async stopPackage(dnpName: string): Promise<void> {
    const pkg = (await this.deps.listPackages()).find((p) => p.dnpName === dnpName);
    for (const container of pkg?.containers ?? []) {
      if (container.running) await this.deps.stopContainer(container.containerName);
    }
    if (!this.job.stoppedValidators.includes(dnpName)) this.job.stoppedValidators.push(dnpName);
  }

  /**
   * Write the manifest `backup` data with the package stopped. Each item is
   * the tar the docker archive API produced for its path, so extracting it
   * into the parent folder puts it back at the same path. Existing files are
   * overwritten; files that are not in the backup are left in place.
   */
  private async restorePackageData(entry: FullBackupPackageEntry, validator: boolean): Promise<void> {
    const pkg = (await this.deps.listPackages()).find((p) => p.dnpName === entry.dnpName);
    if (!pkg) throw Error(`${entry.dnpName} is not running after install`);
    const wasRunning = pkg.containers.filter((c) => c.running).map((c) => c.containerName);
    for (const name of wasRunning) await this.deps.stopContainer(name);

    for (const item of entry.backup) {
      const tarFile = extractedFilePath(this.dir, item.file);
      if (!tarFile) continue;
      const container = pkg.containers.find((c) => !item.service || c.serviceName === item.service);
      if (!container) {
        this.job.warnings.push(
          `${entry.dnpName}: no container for service ${item.service}, "${item.name}" not restored`
        );
        continue;
      }
      await this.deps.putArchive(container.containerName, path.posix.dirname(item.path), tarFile);
    }

    if (validator) {
      if (!this.job.stoppedValidators.includes(entry.dnpName)) this.job.stoppedValidators.push(entry.dnpName);
      return;
    }
    for (const name of wasRunning) await this.deps.startContainer(name);
  }

  private async restoreHttpsMappings(): Promise<void> {
    const mappings = readExtractedJson<FullBackupHttpsMappings>(
      this.dir,
      this.manifest.dappmanagerFiles.httpsMappings,
      []
    );
    if (mappings.length === 0) return;
    const installed = new Set((await this.deps.listPackages()).map((p) => p.dnpName));
    const restored = new Set(
      this.job.steps.filter((s) => s.status === "done").map((s) => s.id.replace(/^package:/, ""))
    );
    const existing = new Set((await this.deps.getHttpsMappings()).map((m) => m.fromSubdomain));
    for (const mapping of mappings) {
      if (existing.has(mapping.fromSubdomain) || !installed.has(mapping.dnpName)) continue;
      // Merge only adds mappings for packages restored by this job
      if (this.job.mode === "merge" && !restored.has(mapping.dnpName)) continue;
      try {
        await this.deps.addHttpsMapping(mapping);
      } catch (e) {
        this.job.warnings.push(`HTTPS mapping ${mapping.fromSubdomain} not restored: ${e.message}`);
      }
    }
  }

  /** Last step: after it the admin logs in with the backed-up node's password */
  private restoreAdminLogin(): void {
    const files = this.manifest.dappmanagerFiles;
    const copies: [string | undefined, string][] = [
      [files.adminPasswords, params.ADMIN_PASSWORDS_JSON_FILE],
      [files.adminStatus, params.ADMIN_STATUS_JSON_FILE],
      [files.adminRecoveryToken, params.ADMIN_RECOVERY_FILE]
    ];
    for (const [archivePath, target] of copies) {
      const source = extractedFilePath(this.dir, archivePath);
      if (source) fs.copyFileSync(source, target);
    }
  }
}
