import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { expect } from "chai";
import tar from "tar-stream";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { FullBackupRestorePackagePlan, InstalledPackageData, PackageContainer, UserSettings } from "@dappnode/types";
import { FullBackupDeps, writeFullBackup } from "../../../src/fullBackup/create.js";
import { EncryptOptions } from "../../../src/fullBackup/format.js";
import { extractBackup } from "../../../src/fullBackup/read.js";
import {
  ensureContainerDir,
  getRestoreDir,
  getRestoreStatus,
  orderPackageSteps,
  resumeRestoreIfInterrupted,
  RestoreDeps,
  startRestore,
  waitForRestoreJob,
  withCurrentGlobalEnvs
} from "../../../src/fullBackup/restore.js";

const fast: EncryptOptions = { kdf: { log2N: 14, r: 8, p: 1 } };
const password = "backup password 123";
const app = "app.dnp.dappnode.eth";
const signer = "web3signer.dnp.dappnode.eth";
const outDir = path.join(params.TEMP_TRANSFER_DIR, "restore-test");

function container(dnpName: string, running = true): PackageContainer {
  return {
    containerName: `DAppNodePackage-${dnpName}`,
    serviceName: dnpName,
    dnpName,
    running,
    volumes: [{ host: "/x", container: "/data", name: `${dnpName}_data` }]
  } as unknown as PackageContainer;
}

function installedPkg(dnpName: string, version: string, running = true): InstalledPackageData {
  return {
    dnpName,
    version,
    isCore: false,
    containers: [container(dnpName, running)]
  } as unknown as InstalledPackageData;
}

function writePackageFiles(dnpName: string, version: string, env: Record<string, string>, stakerNetwork = false): void {
  const dir = path.join(params.REPO_DIR, dnpName);
  fs.mkdirSync(dir, { recursive: true });
  const envYaml = Object.entries(env)
    .map(([k, v]) => `      ${k}: "${v}"`)
    .join("\n");
  const serviceNetworks = stakerNetwork
    ? "    networks:\n      mainnet_network:\n        aliases:\n          - execution.mainnet.staker.dappnode\n"
    : "";
  const rootNetworks = stakerNetwork ? "networks:\n  mainnet_network:\n    external: true\n" : "";
  fs.writeFileSync(
    path.join(dir, "docker-compose.yml"),
    `version: "3.5"\nservices:\n  ${dnpName}:\n    image: ${dnpName}:${version}\n    environment:\n${envYaml}\n${serviceNetworks}${rootNetworks}`
  );
  fs.writeFileSync(
    path.join(dir, "dappnode_package.json"),
    JSON.stringify({ name: dnpName, version, backup: [{ name: "data", path: "/data/keys" }] })
  );
}

/** Create a real encrypted backup of a node with `app` and `web3signer` */
async function createBackupFile(): Promise<string> {
  db.dappnodeWebName.set("old node");
  db.telegramToken.set("telegram-secret");
  db.dyndnsIdentity.set({ address: "0xold", privateKey: "0xoldkey", publicKey: "0xoldpub" });
  db.writeMainDbKeysRaw({
    "execution-client-mainnet": app,
    "auto-update-settings": { "my-packages": { enabled: true } }
  });
  writePackageFiles(app, "1.0.0", { FOO: "from-backup", _DAPPNODE_GLOBAL_DOMAIN: "old.dyndns.dappnode.io" }, true);
  writePackageFiles(signer, "2.0.0", { BAR: "x" });
  fs.mkdirSync(path.dirname(params.ADMIN_PASSWORDS_JSON_FILE), { recursive: true });
  fs.writeFileSync(params.ADMIN_PASSWORDS_JSON_FILE, JSON.stringify({ oldadmin: "$2a$10$old" }));

  const deps: FullBackupDeps = {
    listPackages: async () => [installedPkg(app, "1.0.0"), installedPkg(signer, "2.0.0")],
    getArchive: async (containerName) => Readable.from([Buffer.from(`DATA-OF-${containerName}`)]),
    getHttpsMappings: async () => [{ fromSubdomain: "app", dnpName: app, serviceName: app, port: 80, external: false }],
    stopForBackup: async () => async () => undefined,
    brainClient: () => {
      throw Error("No Staking Brain in this test");
    },
    waitForBrain: async () => undefined
  };
  const { filePath } = await writeFullBackup({ password, outDir, encryptOptions: fast, deps });
  return filePath;
}

const EXECUTION_KEY = "execution-client-mainnet";

/** What the node looked like when a package was installed */
interface InstallSnapshot {
  executionClient: unknown;
  heldStopped: string[];
}

/** Fake node: records every effect the restore performs */
function fakeNode(initial: InstalledPackageData[]): {
  deps: RestoreDeps;
  calls: string[];
  installs: UserSettings[];
  atInstall: Record<string, InstallSnapshot>;
} {
  const packages = new Map(initial.map((p) => [p.dnpName, p]));
  const calls: string[] = [];
  const installs: UserSettings[] = [];
  const atInstall: Record<string, InstallSnapshot> = {};
  const deps: RestoreDeps = {
    listPackages: async () => [...packages.values()],
    installPackage: async ({ dnpName, version, userSettings, start }) => {
      calls.push(`install ${dnpName}@${version}${start ? "" : " stopped"}`);
      installs.push(userSettings);
      atInstall[dnpName] = {
        executionClient: db.readMainDbRaw()[EXECUTION_KEY],
        heldStopped: db.fullBackupRestoreHeldStopped.get()
      };
      packages.set(dnpName, installedPkg(dnpName, version, start));
    },
    applySettings: async ({ dnpName, userSettings, start }) => {
      calls.push(`apply ${dnpName}${start ? "" : " stopped"}`);
      installs.push(userSettings);
      const pkg = packages.get(dnpName);
      if (pkg) packages.set(dnpName, installedPkg(dnpName, pkg.version, start));
    },
    startPackage: async (dnpName) => {
      calls.push(`start ${dnpName}${db.fullBackupRestoreHeldStopped.get().includes(dnpName) ? " while held" : ""}`);
    },
    removePackage: async (dnpName) => {
      calls.push(`remove ${dnpName}`);
      packages.delete(dnpName);
    },
    pathExists: async () => true,
    putArchive: async (containerName, dirPath, tarFile) => {
      calls.push(`put ${containerName} ${dirPath} ${fs.readFileSync(tarFile, "utf8")}`);
    },
    stopContainer: async (name) => {
      calls.push(`stop ${name}`);
    },
    getHttpsMappings: async () => [],
    addHttpsMapping: async (mapping) => {
      calls.push(`https ${mapping.fromSubdomain}`);
    },
    writeSafetySnapshot: async () => {
      calls.push("snapshot");
      return "DNCORE/full-backup-snapshots/snapshot.dnbackup";
    },
    getGlobalEnvs: () => ({ _DAPPNODE_GLOBAL_DOMAIN: "new.dyndns.dappnode.io" }),
    refreshGlobalEnvFile: () => undefined,
    applyStakerSelections: async () => {
      calls.push("apply-staker-selections");
    },
    progress: () => undefined,
    clearProgress: () => {
      calls.push("clear-progress");
    },
    brainClient: () => {
      throw Error("No Staking Brain in this test");
    },
    waitForBrain: async () => undefined
  };
  return { deps, calls, installs, atInstall };
}

/** A tar like the docker archive API returns for one file */
async function writeItemTar(filePath: string, owner: { uid: number; gid: number }): Promise<void> {
  const pack = tar.pack();
  pack.entry({ name: path.basename(filePath), mode: 0o600, ...owner }, "SECRET");
  pack.finalize();
  const chunks: Buffer[] = [];
  for await (const chunk of pack) chunks.push(chunk as Buffer);
  fs.writeFileSync(filePath, Buffer.concat(chunks));
}

async function listTarEntries(data: Buffer): Promise<string[]> {
  const entries: string[] = [];
  const extract = tar.extract();
  extract.on("entry", (header, stream, next) => {
    entries.push(`${header.type} ${header.name} ${header.mode?.toString(8)} ${header.uid}:${header.gid}`);
    stream.on("end", next);
    stream.resume();
  });
  await new Promise<void>((resolve, reject) => {
    extract.on("finish", resolve);
    extract.on("error", reject);
    extract.end(data);
  });
  return entries;
}

async function expectRejects(promise: Promise<unknown>, message: RegExp): Promise<void> {
  try {
    await promise;
  } catch (e) {
    expect((e as Error).message).to.match(message);
    return;
  }
  throw Error("Expected rejection");
}

describe("fullBackup / restore", () => {
  let backupFile: string;
  let adminPasswordsBefore: string | null;

  before(async () => {
    adminPasswordsBefore = fs.existsSync(params.ADMIN_PASSWORDS_JSON_FILE)
      ? fs.readFileSync(params.ADMIN_PASSWORDS_JSON_FILE, "utf8")
      : null;
    db.clearMainDb();
    db.clearCacheDb();
    backupFile = await createBackupFile();
  });

  beforeEach(() => {
    db.clearMainDb();
    db.clearCacheDb();
    fs.rmSync(getRestoreDir(), { recursive: true, force: true });
    fs.writeFileSync(params.ADMIN_PASSWORDS_JSON_FILE, JSON.stringify({ newadmin: "$2a$10$new" }));
  });

  after(() => {
    db.clearMainDb();
    db.clearCacheDb();
    fs.rmSync(getRestoreDir(), { recursive: true, force: true });
    fs.rmSync(params.TEMP_TRANSFER_DIR, { recursive: true, force: true });
    for (const dnpName of [app, signer])
      fs.rmSync(path.join(params.REPO_DIR, dnpName), { recursive: true, force: true });
    if (adminPasswordsBefore === null) fs.rmSync(params.ADMIN_PASSWORDS_JSON_FILE, { force: true });
    else fs.writeFileSync(params.ADMIN_PASSWORDS_JSON_FILE, adminPasswordsBefore);
  });

  it("clones a node onto a fresh one", async () => {
    db.dappnodeWebName.set("fresh node");
    db.writeMainDbKeysRaw({ "auto-update-settings": { "my-packages": { enabled: false } } });
    const { deps, calls, installs, atInstall } = fakeNode([]);

    await startRestore({ filePath: backupFile, password, mode: "clone", confirmValidatorsOff: true, deps });
    await waitForRestoreJob();

    const status = getRestoreStatus();
    expect(status.status, JSON.stringify(status.steps)).to.equal("done");
    expect(status).to.not.have.property("packagePlans");
    expect(status.safetySnapshot).to.equal("DNCORE/full-backup-snapshots/snapshot.dnbackup");
    expect(calls[0]).to.equal("snapshot");
    expect(calls).to.include(`install ${app}@1.0.0 stopped`);
    expect(calls).to.include(`install ${signer}@2.0.0 stopped`);
    expect(calls).to.include(`put DAppNodePackage-${app} /data DATA-OF-DAppNodePackage-${app}`);
    expect(calls).to.include("https app");

    // Data is written with the package stopped; validators stay stopped
    // Packages are installed stopped, get their data, then start; validators
    // are never started
    const appPut = calls.indexOf(`put DAppNodePackage-${app} /data DATA-OF-DAppNodePackage-${app}`);
    expect(calls.indexOf(`install ${app}@1.0.0 stopped`)).to.be.lessThan(appPut);
    expect(calls.indexOf(`start ${app}`)).to.be.greaterThan(appPut);
    expect(calls).to.include(`install ${signer}@2.0.0 stopped`);
    expect(calls).to.not.include(`start ${signer}`);
    expect(calls.some((c) => c.startsWith("stop "))).to.equal(false);
    expect(status.stoppedValidators).to.deep.equal([signer]);

    // While a package waits for its data nothing else may start it; a
    // validator stays held after the restore
    expect(atInstall[app].heldStopped).to.include(app);
    expect(calls).to.include(`start ${app}`);
    expect(db.fullBackupRestoreHeldStopped.get()).to.deep.equal([signer]);

    // A staker client is selected only once its package is installed, and
    // the selection is then applied to the packages
    expect(atInstall[app].executionClient).to.equal(undefined);
    expect(calls.indexOf("apply-staker-selections")).to.be.greaterThan(calls.indexOf(`start ${app}`));
    expect(calls[calls.length - 1]).to.equal("clear-progress");

    // Global envs baked into the compose get this node's current values, and
    // a clone keeps the staker network
    const appSettings = installs.find((s) => s.environment?.[app]);
    expect(appSettings?.networks?.serviceNetworks?.[app]).to.have.property("mainnet_network");
    expect(appSettings?.environment?.[app]).to.deep.equal({
      FOO: "from-backup",
      _DAPPNODE_GLOBAL_DOMAIN: "new.dyndns.dappnode.io"
    });

    // Settings, identity and admin login come from the backup
    const mainDb = db.readMainDbRaw();
    expect(mainDb["dappnode-web-name"]).to.equal("old node");
    expect(mainDb["dyndns-identity"]).to.deep.equal({
      address: "0xold",
      privateKey: "0xoldkey",
      publicKey: "0xoldpub"
    });
    expect(mainDb["execution-client-mainnet"]).to.equal(app);
    expect(mainDb["auto-update-settings"]).to.deep.equal({ "my-packages": { enabled: true } });
    expect(JSON.parse(fs.readFileSync(params.ADMIN_PASSWORDS_JSON_FILE, "utf8"))).to.deep.equal({
      oldadmin: "$2a$10$old"
    });
    expect(status.steps[status.steps.length - 1].id).to.equal("admin-login");

    // Decrypted content is removed
    expect(fs.existsSync(path.join(getRestoreDir(), "extracted"))).to.equal(false);
  });

  it("merges into a node with its own packages and staker selection", async () => {
    db.dappnodeWebName.set("this node");
    db.writeMainDbKeysRaw({
      "execution-client-mainnet": "geth.dnp.dappnode.eth",
      "auto-update-settings": { "my-packages": { enabled: true }, [app]: { enabled: true } }
    });
    const { deps, calls, installs } = fakeNode([
      installedPkg(app, "1.0.0"),
      installedPkg("other.dnp.dappnode.eth", "1.0.0")
    ]);

    await startRestore({ filePath: backupFile, password, mode: "merge", confirmValidatorsOff: true, deps });
    await waitForRestoreJob();

    const status = getRestoreStatus();
    expect(status.status, JSON.stringify(status.steps)).to.equal("done");
    // Same version installed: settings applied, data kept
    expect(calls).to.include(`apply ${app}`);
    expect(calls.some((c) => c.startsWith(`put DAppNodePackage-${app}`))).to.equal(false);
    // Missing validator package: installed with its data and left stopped
    expect(calls).to.include(`install ${signer}@2.0.0 stopped`);
    expect(status.stoppedValidators).to.deep.equal([signer]);
    // Nothing is removed and this node's settings stay
    expect(calls.some((c) => c.startsWith("remove"))).to.equal(false);
    const mainDb = db.readMainDbRaw();
    expect(mainDb["dappnode-web-name"]).to.equal("this node");
    expect(mainDb["execution-client-mainnet"]).to.equal("geth.dnp.dappnode.eth");
    expect(mainDb["auto-update-settings"]).to.deep.equal({
      "my-packages": { enabled: true },
      [app]: { enabled: true }
    });
    expect(JSON.parse(fs.readFileSync(params.ADMIN_PASSWORDS_JSON_FILE, "utf8"))).to.have.property("newadmin");
    // This node uses geth for mainnet: the restored client loses its staker role
    expect(status.warnings.some((w) => w.includes("without its staker role"))).to.equal(true);
    expect(installs.find((s) => s.environment?.[app])?.networks).to.equal(undefined);
  });

  it("merges the backup's staker selection into a node that has none", async () => {
    const { deps, calls, installs } = fakeNode([]);
    await startRestore({ filePath: backupFile, password, mode: "merge", confirmValidatorsOff: true, deps });
    await waitForRestoreJob();

    const status = getRestoreStatus();
    expect(status.status, JSON.stringify(status.steps)).to.equal("done");
    expect(status.steps.map((s) => s.id)).to.not.include("dappmanager-settings");
    // No selection on this node is not a conflict: the client keeps its staker network
    expect(status.warnings.some((w) => w.includes("without its staker role"))).to.equal(false);
    const appSettings = installs.find((s) => s.environment?.[app]);
    expect(appSettings?.networks?.serviceNetworks?.[app]).to.have.property("mainnet_network");
    expect(db.readMainDbRaw()[EXECUTION_KEY]).to.equal(app);
    expect(calls).to.include("apply-staker-selections");
  });

  it("does not select a staker client whose package could not be restored", async () => {
    const { deps, calls } = fakeNode([]);
    const installPackage = deps.installPackage;
    deps.installPackage = async (args) => {
      if (args.dnpName === app) throw Error("release not found");
      await installPackage(args);
    };
    await startRestore({ filePath: backupFile, password, mode: "clone", confirmValidatorsOff: true, deps });
    await waitForRestoreJob();

    const status = getRestoreStatus();
    expect(status.status).to.equal("failed");
    expect(status.steps.find((s) => s.id === `package:${app}`)?.error).to.equal("release not found");
    expect(status.steps.find((s) => s.id === "staker-selections")?.status).to.equal("done");
    expect(db.readMainDbRaw()[EXECUTION_KEY]).to.equal(undefined);
    expect(calls).to.not.include("apply-staker-selections");
  });

  it("removes packages that are not in the backup when cloning", async () => {
    const { deps, calls } = fakeNode([installedPkg("extra.dnp.dappnode.eth", "1.0.0")]);
    await startRestore({ filePath: backupFile, password, mode: "clone", confirmValidatorsOff: true, deps });
    await waitForRestoreJob();
    expect(calls).to.include("remove extra.dnp.dappnode.eth");
    expect(calls.indexOf("remove extra.dnp.dappnode.eth")).to.be.lessThan(
      calls.indexOf(`install ${app}@1.0.0 stopped`)
    );
  });

  it("requires confirming that the old node is off for validator packages", async () => {
    const { deps, calls } = fakeNode([]);
    await expectRejects(
      startRestore({ filePath: backupFile, password, mode: "clone", confirmValidatorsOff: false, deps }),
      /validator keys/
    );
    expect(calls).to.deep.equal([]);
    expect(getRestoreStatus().status).to.equal("idle");
    expect(fs.existsSync(path.join(getRestoreDir(), "extracted"))).to.equal(false);
  });

  it("removes the decrypted backup when the restore cannot be planned", async () => {
    const { deps } = fakeNode([]);
    deps.listPackages = async () => {
      throw Error("docker is not responding");
    };
    await expectRejects(
      startRestore({ filePath: backupFile, password, mode: "clone", confirmValidatorsOff: true, deps }),
      /docker is not responding/
    );
    expect(fs.existsSync(path.join(getRestoreDir(), "extracted"))).to.equal(false);
    expect(getRestoreStatus().status).to.equal("idle");
  });

  it("rejects a second restore requested while the first one is extracting", async () => {
    const { deps, calls } = fakeNode([]);
    const args = { filePath: backupFile, password, mode: "clone" as const, confirmValidatorsOff: true, deps };
    const first = startRestore(args);
    await expectRejects(startRestore(args), /already running/);
    await first;
    await waitForRestoreJob();

    const status = getRestoreStatus();
    expect(status.status, JSON.stringify(status.steps)).to.equal("done");
    expect(calls.filter((c) => c === "snapshot")).to.have.length(1);
  });

  it("rejects a wrong password before changing anything", async () => {
    const { deps, calls } = fakeNode([]);
    await expectRejects(
      startRestore({
        filePath: backupFile,
        password: "wrong password!!",
        mode: "clone",
        confirmValidatorsOff: true,
        deps
      }),
      /Wrong password/
    );
    expect(calls).to.deep.equal([]);
    expect(fs.existsSync(path.join(getRestoreDir(), "extracted"))).to.equal(false);
  });

  it("aborts a restore interrupted before its safety snapshot", async () => {
    fs.mkdirSync(getRestoreDir(), { recursive: true });
    fs.writeFileSync(
      path.join(getRestoreDir(), "job.json"),
      JSON.stringify({
        status: "running",
        mode: "clone",
        steps: [
          { id: "extract", title: "x", status: "done" },
          { id: "snapshot", title: "x", status: "running" },
          { id: "finish", title: "x", status: "pending" }
        ],
        warnings: [],
        stoppedValidators: []
      })
    );
    const { deps, calls } = fakeNode([]);
    resumeRestoreIfInterrupted(deps);
    await waitForRestoreJob();
    const status = getRestoreStatus();
    expect(status.status).to.equal("failed");
    expect(status.steps[1].error).to.include("before anything was changed");
    expect(calls).to.deep.equal([]);
  });

  it("resumes with the stored plan when packages were installed before the interruption", async () => {
    fs.mkdirSync(getRestoreDir(), { recursive: true });
    await extractBackup(backupFile, password, path.join(getRestoreDir(), "extracted"));
    const plan = (dnpName: string, version: string, validator: boolean): FullBackupRestorePackagePlan => ({
      dnpName,
      action: "install",
      backupVersion: version,
      installedVersion: null,
      isCore: false,
      restoreData: true,
      validator
    });
    const stepIds = ["extract", "snapshot", "pause-auto-updates", "dappmanager-settings", `package:${app}`];
    fs.writeFileSync(
      path.join(getRestoreDir(), "job.json"),
      JSON.stringify({
        status: "running",
        mode: "clone",
        packagePlans: [plan(app, "1.0.0", false), plan(signer, "2.0.0", true)],
        previousAutoUpdateSettings: {},
        steps: [
          ...stepIds.map((id) => ({ id, title: id, status: id === `package:${app}` ? "running" : "done" })),
          { id: `package:${signer}`, title: "x", status: "pending" },
          { id: "finish", title: "x", status: "pending" }
        ],
        warnings: [],
        stoppedValidators: []
      })
    );
    // Both were created stopped, and dappmanager restarted before their data was written
    const { deps, calls } = fakeNode([installedPkg(app, "1.0.0", false), installedPkg(signer, "2.0.0", false)]);
    resumeRestoreIfInterrupted(deps);
    await waitForRestoreJob();

    const status = getRestoreStatus();
    expect(status.status, JSON.stringify(status.steps)).to.equal("done");
    expect(calls.filter((c) => c !== "clear-progress")).to.deep.equal([
      `install ${app}@1.0.0 stopped`,
      `put DAppNodePackage-${app} /data DATA-OF-DAppNodePackage-${app}`,
      `start ${app}`,
      `install ${signer}@2.0.0 stopped`,
      `put DAppNodePackage-${signer} /data DATA-OF-DAppNodePackage-${signer}`
    ]);
    expect(status.stoppedValidators).to.deep.equal([signer]);
    expect(db.fullBackupRestoreHeldStopped.get()).to.deep.equal([signer]);
  });

  it("creates the missing parent folders of a backup path before extracting into it", async () => {
    const tarFile = path.join(outDir, "secret_ed25519.tar");
    await writeItemTar(tarFile, { uid: 1000, gid: 1001 });
    const existing = new Set(["/", "/data"]);
    const puts: { dirPath: string; entries: string[] }[] = [];
    const deps: Pick<RestoreDeps, "pathExists" | "putArchive"> = {
      pathExists: async (_containerName, containerPath) => existing.has(containerPath),
      putArchive: async (_containerName, dirPath, data) => {
        puts.push({ dirPath, entries: await listTarEntries(data as Buffer) });
      }
    };

    await ensureContainerDir(deps, "DAppNodePackage-polkadot", "/data/chains/polkadot/network", tarFile);
    expect(puts).to.deep.equal([
      {
        dirPath: "/data",
        entries: [
          "directory chains 755 1000:1001",
          "directory chains/polkadot 755 1000:1001",
          "directory chains/polkadot/network 755 1000:1001"
        ]
      }
    ]);

    // Nothing to create when the folder exists
    await ensureContainerDir(deps, "DAppNodePackage-polkadot", "/data", tarFile);
    expect(puts).to.have.length(1);
  });

  it("orders removals, then system packages, then dependencies before dependants", () => {
    const plan = (dnpName: string, action: FullBackupRestorePackagePlan["action"], isCore = false) =>
      ({ dnpName, action, isCore }) as FullBackupRestorePackagePlan;
    const ordered = orderPackageSteps(
      [
        plan("a", "install"),
        plan("b", "install"),
        plan("core-x", "update", true),
        plan("old", "remove"),
        plan("s", "skip")
      ],
      (name) => (name === "a" ? ["b"] : [])
    );
    expect(ordered.map((p) => p.dnpName)).to.deep.equal(["old", "core-x", "b", "a"]);
  });

  it("only rewrites prefixed global envs that this node defines", () => {
    const settings = withCurrentGlobalEnvs(
      { environment: { svc: { _DAPPNODE_GLOBAL_DOMAIN: "old", _DAPPNODE_GLOBAL_UNKNOWN: "keep", OTHER: "x" } } },
      { _DAPPNODE_GLOBAL_DOMAIN: "new", OTHER: "ignored" }
    );
    expect(settings.environment?.svc).to.deep.equal({
      _DAPPNODE_GLOBAL_DOMAIN: "new",
      _DAPPNODE_GLOBAL_UNKNOWN: "keep",
      OTHER: "x"
    });
  });
});
