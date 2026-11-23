import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { expect } from "chai";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { FullBackupRestorePackagePlan, InstalledPackageData, PackageContainer, UserSettings } from "@dappnode/types";
import { FullBackupDeps, writeFullBackup } from "../../../src/fullBackup/create.js";
import { EncryptOptions } from "../../../src/fullBackup/format.js";
import {
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

function installedPkg(dnpName: string, version: string): InstalledPackageData {
  return { dnpName, version, isCore: false, containers: [container(dnpName)] } as unknown as InstalledPackageData;
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
    getHttpsMappings: async () => [{ fromSubdomain: "app", dnpName: app, serviceName: app, port: 80, external: false }]
  };
  const { filePath } = await writeFullBackup({ password, outDir, encryptOptions: fast, deps });
  return filePath;
}

/** Fake node: records every effect the restore performs */
function fakeNode(initial: InstalledPackageData[]): { deps: RestoreDeps; calls: string[]; installs: UserSettings[] } {
  const packages = new Map(initial.map((p) => [p.dnpName, p]));
  const calls: string[] = [];
  const installs: UserSettings[] = [];
  const deps: RestoreDeps = {
    listPackages: async () => [...packages.values()],
    installPackage: async ({ dnpName, version, userSettings }) => {
      calls.push(`install ${dnpName}@${version}`);
      installs.push(userSettings);
      packages.set(dnpName, installedPkg(dnpName, version));
    },
    applySettings: async ({ dnpName, userSettings }) => {
      calls.push(`apply ${dnpName}`);
      installs.push(userSettings);
    },
    removePackage: async (dnpName) => {
      calls.push(`remove ${dnpName}`);
      packages.delete(dnpName);
    },
    putArchive: async (containerName, dirPath, tarFile) => {
      calls.push(`put ${containerName} ${dirPath} ${fs.readFileSync(tarFile, "utf8")}`);
    },
    stopContainer: async (name) => {
      calls.push(`stop ${name}`);
    },
    startContainer: async (name) => {
      calls.push(`start ${name}`);
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
    progress: () => undefined
  };
  return { deps, calls, installs };
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
    const { deps, calls, installs } = fakeNode([]);

    await startRestore({ filePath: backupFile, password, mode: "clone", confirmValidatorsOff: true, deps });
    await waitForRestoreJob();

    const status = getRestoreStatus();
    expect(status.status, JSON.stringify(status.steps)).to.equal("done");
    expect(status.safetySnapshot).to.equal("DNCORE/full-backup-snapshots/snapshot.dnbackup");
    expect(calls[0]).to.equal("snapshot");
    expect(calls).to.include(`install ${app}@1.0.0`);
    expect(calls).to.include(`install ${signer}@2.0.0`);
    expect(calls).to.include(`put DAppNodePackage-${app} /data DATA-OF-DAppNodePackage-${app}`);
    expect(calls).to.include("https app");

    // Data is written with the package stopped; validators stay stopped
    const appPut = calls.indexOf(`put DAppNodePackage-${app} /data DATA-OF-DAppNodePackage-${app}`);
    expect(calls.indexOf(`stop DAppNodePackage-${app}`)).to.be.lessThan(appPut);
    expect(calls.indexOf(`start DAppNodePackage-${app}`)).to.be.greaterThan(appPut);
    expect(calls).to.not.include(`start DAppNodePackage-${signer}`);
    expect(status.stoppedValidators).to.deep.equal([signer]);

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
    expect(calls).to.include(`install ${signer}@2.0.0`);
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

  it("removes packages that are not in the backup when cloning", async () => {
    const { deps, calls } = fakeNode([installedPkg("extra.dnp.dappnode.eth", "1.0.0")]);
    await startRestore({ filePath: backupFile, password, mode: "clone", confirmValidatorsOff: true, deps });
    await waitForRestoreJob();
    expect(calls).to.include("remove extra.dnp.dappnode.eth");
    expect(calls.indexOf("remove extra.dnp.dappnode.eth")).to.be.lessThan(calls.indexOf(`install ${app}@1.0.0`));
  });

  it("requires confirming that the old node is off for validator packages", async () => {
    const { deps, calls } = fakeNode([]);
    await expectRejects(
      startRestore({ filePath: backupFile, password, mode: "clone", confirmValidatorsOff: false, deps }),
      /validator keys/
    );
    expect(calls).to.deep.equal([]);
    expect(getRestoreStatus().status).to.equal("idle");
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
