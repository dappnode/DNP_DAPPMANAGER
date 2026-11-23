import fs from "fs";
import path from "path";
import zlib from "zlib";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import tar from "tar-stream";
import { expect } from "chai";
import sinon from "sinon";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { FullBackupManifest, FullBackupProgress, InstalledPackageData, PackageContainer } from "@dappnode/types";
import {
  createFullBackup,
  FullBackupDeps,
  getFullBackupStatus,
  MANIFEST_ARCHIVE_PATH
} from "../../../src/fullBackup/create.js";
import { createDecryptStream, EncryptOptions } from "../../../src/fullBackup/format.js";
import { canStopForBackup } from "../../../src/fullBackup/packageStop.js";

const fast: EncryptOptions = { kdf: { log2N: 14, r: 8, p: 1 } };
const password = "backup password 123";
const dnpName = "example.dnp.dappnode.eth";
const repoDir = path.join(params.REPO_DIR, dnpName);

const container = {
  containerName: `DAppNodePackage-${dnpName}`,
  serviceName: dnpName,
  dnpName,
  volumes: [{ host: "/var/lib/docker/volumes/x/_data", container: "/data", name: "exampledata" }]
} as unknown as PackageContainer;

const pkg = {
  dnpName,
  version: "1.2.3",
  origin: "/ipfs/QmExample",
  isCore: false,
  containers: [container]
} as unknown as InstalledPackageData;

const deps: FullBackupDeps = {
  listPackages: async () => [pkg],
  getArchive: async (_containerName, archivePath) => {
    if (archivePath === "/data/keys") return Readable.from([Buffer.from("TAR-BYTES-OF-KEYS")]);
    throw Object.assign(Error("not found"), { statusCode: 404 });
  },
  getHttpsMappings: async () => [{ fromSubdomain: "app", dnpName, serviceName: dnpName, port: 80, external: true }],
  stopForBackup: async () => async () => undefined,
  brainClient: () => {
    throw Error("No Staking Brain in this test");
  },
  waitForBrain: async () => undefined
};

/** Deps that record the order of stops, copies and restarts */
function recordingDeps(events: string[], overrides: Partial<FullBackupDeps> = {}): FullBackupDeps {
  return {
    ...deps,
    getArchive: async (containerName, archivePath) => {
      events.push(`copy ${archivePath}`);
      return deps.getArchive(containerName, archivePath);
    },
    stopForBackup: async (p) => {
      events.push(`stop ${p.dnpName}`);
      return async () => {
        events.push(`restart ${p.dnpName}`);
      };
    },
    ...overrides
  };
}

function writeManifest(backup: { name: string; path: string }[]): void {
  fs.writeFileSync(
    path.join(repoDir, "dappnode_package.json"),
    JSON.stringify({ name: dnpName, version: "1.2.3", backup })
  );
}

/** Decrypt, gunzip and untar a backup into { path: content } in archive order */
async function readBackup(filePath: string, pass = password): Promise<Map<string, Buffer>> {
  const entries = new Map<string, Buffer>();
  const extract = tar.extract();
  extract.on("entry", (header, stream, next) => {
    const chunks: Buffer[] = [];
    stream.on("data", (c: Buffer) => chunks.push(c));
    stream.on("end", () => {
      entries.set(header.name, Buffer.concat(chunks));
      next();
    });
  });
  await pipeline(fs.createReadStream(filePath), createDecryptStream(pass), zlib.createGunzip(), extract);
  return entries;
}

function json(entries: Map<string, Buffer>, name: string): Record<string, unknown> {
  const data = entries.get(name);
  if (!data) throw Error(`Missing archive entry ${name}`);
  return JSON.parse(data.toString());
}

describe("fullBackup / createFullBackup", () => {
  let adminPasswordsBefore: string | null = null;

  before(() => {
    adminPasswordsBefore = fs.existsSync(params.ADMIN_PASSWORDS_JSON_FILE)
      ? fs.readFileSync(params.ADMIN_PASSWORDS_JSON_FILE, "utf8")
      : null;
  });

  beforeEach(() => {
    db.clearMainDb();
    db.clearCacheDb();
    fs.rmSync(params.FULL_BACKUP_DIR, { recursive: true, force: true });
    fs.mkdirSync(repoDir, { recursive: true });
    fs.writeFileSync(
      path.join(repoDir, "docker-compose.yml"),
      `version: "3.5"\nservices:\n  ${dnpName}:\n    image: ${dnpName}:1.2.3\n    environment:\n      FOO: bar\n`
    );
    fs.writeFileSync(
      path.join(repoDir, "dappnode_package.json"),
      JSON.stringify({
        name: dnpName,
        version: "1.2.3",
        backup: [
          { name: "keys", path: "/data/keys" },
          { name: "missing", path: "/data/missing" }
        ]
      })
    );
    fs.mkdirSync(path.dirname(params.ADMIN_PASSWORDS_JSON_FILE), { recursive: true });
    fs.writeFileSync(params.ADMIN_PASSWORDS_JSON_FILE, JSON.stringify({ admin: "$2a$10$hash" }));
  });

  afterEach(() => {
    sinon.restore();
    db.clearMainDb();
    db.clearCacheDb();
    fs.rmSync(params.FULL_BACKUP_DIR, { recursive: true, force: true });
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  after(() => {
    if (adminPasswordsBefore === null) fs.rmSync(params.ADMIN_PASSWORDS_JSON_FILE, { force: true });
    else fs.writeFileSync(params.ADMIN_PASSWORDS_JSON_FILE, adminPasswordsBefore);
  });

  it("creates an encrypted archive with settings, identity, auth and package data", async () => {
    db.dappnodeWebName.set("my node");
    db.telegramToken.set("telegram-secret");
    db.dyndnsIdentity.set({ address: "0xabc", privateKey: "0xkey", publicKey: "0xpub" });
    db.doubleNat.set(true); // machine-specific, must be left out
    db.isNatRenewalDisabled.set(true); // user setting stored in the cache DB
    db.counterViews.set(5); // cache, must be left out

    const result = await createFullBackup({ password, encryptOptions: fast, deps });

    expect(result.fileName).to.match(/^dappnode-backup-.*\.dnbackup$/);
    expect(result.warnings).to.have.length(1);
    expect(result.warnings[0]).to.include("missing").and.include("does not exist");
    const filePath = db.fileTransferPath.get(result.fileId);
    // Not in the temp transfer dir, which other calls delete as a whole
    expect(filePath).to.equal(path.join(params.FULL_BACKUP_DIR, result.fileName));
    expect(fs.statSync(filePath as string).size).to.equal(result.sizeBytes);

    const entries = await readBackup(filePath as string);
    expect([...entries.keys()][0]).to.equal(MANIFEST_ARCHIVE_PATH);

    const manifest = json(entries, MANIFEST_ARCHIVE_PATH) as unknown as FullBackupManifest;
    expect(manifest.formatVersion).to.equal(1);
    expect(manifest.packages).to.have.length(1);
    const entry = manifest.packages[0];
    expect(entry).to.include({ dnpName, version: "1.2.3", origin: "/ipfs/QmExample", coverage: "covered" });
    expect(entry.namedVolumes).to.deep.equal(["exampledata"]);
    expect(entry.backup[0].file).to.equal(`packages/${dnpName}/backup/keys.tar`);
    expect(entry.backup[1].file).to.equal(undefined);
    expect(entry.backup[1].error).to.include("does not exist");

    // Every path the manifest points to is in the archive
    const referenced = [
      ...Object.values(manifest.dappmanagerFiles),
      ...Object.values(entry.files),
      ...entry.backup.map((b) => b.file)
    ].filter(Boolean);
    for (const archivePath of referenced) expect(entries.has(archivePath as string), archivePath).to.equal(true);

    expect(entries.get(`packages/${dnpName}/backup/keys.tar`)?.toString()).to.equal("TAR-BYTES-OF-KEYS");
    const userSettings = json(entries, `packages/${dnpName}/user-settings.json`) as {
      environment?: Record<string, Record<string, string>>;
    };
    expect(userSettings.environment?.[dnpName]?.FOO).to.equal("bar");

    const mainDb = json(entries, "dappmanager/maindb.json");
    expect(mainDb).to.include({ "dappnode-web-name": "my node", "telegram-token": "telegram-secret" });
    expect(mainDb["dyndns-identity"]).to.deep.equal({ address: "0xabc", privateKey: "0xkey", publicKey: "0xpub" });
    expect(mainDb).to.not.have.property("double-nat");
    expect(json(entries, "dappmanager/cachedb.json")).to.deep.equal({ "is-nat-renewal-disabled": true });
    expect(json(entries, "dappmanager/admin-passwords.json")).to.deep.equal({ admin: "$2a$10$hash" });
    expect(json(entries, "dappmanager/https-mappings.json")).to.have.length(1);

    // Secrets never appear in plaintext and staging files are removed
    expect(fs.readFileSync(filePath as string).includes(Buffer.from("telegram-secret"))).to.equal(false);
    expect(fs.readdirSync(params.FULL_BACKUP_DIR)).to.deep.equal([result.fileName]);
  });

  it("reports packages with volumes and no backup paths as not covered", async () => {
    fs.writeFileSync(path.join(repoDir, "dappnode_package.json"), JSON.stringify({ name: dnpName, version: "1.2.3" }));
    const result = await createFullBackup({ password, encryptOptions: fast, deps });
    const entries = await readBackup(db.fileTransferPath.get(result.fileId) as string);
    const manifest = json(entries, MANIFEST_ARCHIVE_PATH) as unknown as FullBackupManifest;
    expect(manifest.packages[0].coverage).to.equal("not-covered");
    expect(manifest.packages[0].backup).to.deep.equal([]);
  });

  it("cannot be opened with another password", async () => {
    const result = await createFullBackup({ password, encryptOptions: fast, deps });
    try {
      await readBackup(db.fileTransferPath.get(result.fileId) as string, "another password");
    } catch (e) {
      expect((e as Error).message).to.match(/Wrong password/);
      return;
    }
    throw Error("Expected decryption to fail");
  });

  it("rejects short passwords before doing any work", async () => {
    let listed = false;
    const spyDeps = { ...deps, listPackages: async () => ((listed = true), [pkg]) };
    try {
      await createFullBackup({ password: "short", encryptOptions: fast, deps: spyDeps });
      throw Error("Expected an error");
    } catch (e) {
      expect((e as Error).message).to.match(/at least 10 characters/);
    }
    expect(listed).to.equal(false);
  });

  it("copies non-validator packages while running", async () => {
    const events: string[] = [];
    await createFullBackup({ password, encryptOptions: fast, deps: recordingDeps(events) });
    expect(events).to.deep.equal(["copy /data/keys", "copy /data/missing"]);
  });

  it("stops a validator only while its data is copied, then restarts it", async () => {
    writeManifest([{ name: "slashing-protection", path: "/data/keys" }]);
    const events: string[] = [];
    await createFullBackup({ password, encryptOptions: fast, deps: recordingDeps(events) });
    expect(events).to.deep.equal([`stop ${dnpName}`, "copy /data/keys", `restart ${dnpName}`]);
  });

  it("keeps validators stopped only when the admin is moving this node", async () => {
    writeManifest([{ name: "slashing-protection", path: "/data/keys" }]);

    const events: string[] = [];
    const restarted = await createFullBackup({ password, encryptOptions: fast, deps: recordingDeps(events) });
    expect(events).to.include(`restart ${dnpName}`);
    expect(restarted.stoppedValidators).to.deep.equal([]);

    const kept: string[] = [];
    const result = await createFullBackup({
      password,
      keepValidatorsStopped: true,
      encryptOptions: fast,
      deps: recordingDeps(kept)
    });
    expect(kept).to.deep.equal([`stop ${dnpName}`, "copy /data/keys"]);
    expect(result.stoppedValidators).to.deep.equal([dnpName]);
  });

  it("does not report a validator as stopped when it could not be stopped", async () => {
    writeManifest([{ name: "slashing-protection", path: "/data/keys" }]);
    const events: string[] = [];
    const result = await createFullBackup({
      password,
      keepValidatorsStopped: true,
      encryptOptions: fast,
      deps: recordingDeps(events, {
        stopForBackup: async () => {
          throw Error("docker compose stop failed");
        }
      })
    });
    expect(events).to.deep.equal(["copy /data/keys"]);
    expect(result.stoppedValidators).to.deep.equal([]);
    expect(result.warnings.some((w) => w.includes("docker compose stop failed"))).to.equal(true);
    expect(result.warnings.some((w) => w.includes("was NOT left stopped"))).to.equal(true);
  });

  it("keeps a validator stopped even if it declares no backup paths", async () => {
    const signer = { ...pkg, dnpName: "web3signer.dnp.dappnode.eth" };
    const listPackages = async (): Promise<InstalledPackageData[]> => [signer];

    const events: string[] = [];
    const running = await createFullBackup({
      password,
      encryptOptions: fast,
      deps: recordingDeps(events, { listPackages })
    });
    expect(events).to.deep.equal([]);
    expect(running.stoppedValidators).to.deep.equal([]);

    const result = await createFullBackup({
      password,
      keepValidatorsStopped: true,
      encryptOptions: fast,
      deps: recordingDeps(events, { listPackages })
    });
    expect(events).to.deep.equal([`stop ${signer.dnpName}`]);
    expect(result.stoppedValidators).to.deep.equal([signer.dnpName]);
  });

  it("restarts the validators it left stopped when the backup fails afterwards", async () => {
    writeManifest([{ name: "slashing-protection", path: "/data/keys" }]);
    const events: string[] = [];
    try {
      await createFullBackup({
        password,
        keepValidatorsStopped: true,
        // Rejected when the archive is written, after every package was staged
        encryptOptions: { kdf: { log2N: 99, r: 8, p: 1 } },
        deps: recordingDeps(events)
      });
      throw Error("Expected an error");
    } catch (e) {
      expect((e as Error).message).to.match(/Unsupported scrypt cost/);
    }
    expect(events).to.deep.equal([`stop ${dnpName}`, "copy /data/keys", `restart ${dnpName}`]);
  });

  it("names the validators that could not be restarted after a failed backup", async () => {
    writeManifest([{ name: "slashing-protection", path: "/data/keys" }]);
    const failing = {
      ...deps,
      stopForBackup: async () => async () => {
        throw Error("docker compose start failed");
      }
    };
    try {
      await createFullBackup({
        password,
        keepValidatorsStopped: true,
        encryptOptions: { kdf: { log2N: 99, r: 8, p: 1 } },
        deps: failing
      });
      throw Error("Expected an error");
    } catch (e) {
      expect((e as Error).message)
        .to.match(/Unsupported scrypt cost/)
        .and.match(/could not be started again/)
        .and.include(dnpName);
    }
    expect(getFullBackupStatus().last?.error).to.include(dnpName);
  });

  it("stops copying when the disk cannot hold the staged data twice", async () => {
    writeManifest([{ name: "slashing-protection", path: "/data/keys" }]);
    // Enough for the check before staging, not for the 17 bytes of /data/keys and their archive
    const free = 1024 * 1024 * 1024 + 5;
    sinon.stub(fs.promises, "statfs").resolves({ bavail: free, bsize: 1 } as fs.StatsFs);
    const events: string[] = [];
    try {
      await createFullBackup({
        password,
        keepValidatorsStopped: true,
        encryptOptions: fast,
        deps: recordingDeps(events)
      });
      throw Error("Expected an error");
    } catch (e) {
      expect((e as Error).message)
        .to.match(/Not enough free disk space/)
        .and.include(`"slashing-protection" of ${dnpName}`);
    }
    // Nothing is left on disk and the validator runs again
    expect(fs.readdirSync(params.FULL_BACKUP_DIR)).to.deep.equal([]);
    expect(events).to.deep.equal([`stop ${dnpName}`, "copy /data/keys", `restart ${dnpName}`]);
  });

  it("removes what earlier backups left behind, but not a backup that can still be downloaded", async () => {
    fs.mkdirSync(path.join(params.FULL_BACKUP_DIR, "full-backup-stale"), { recursive: true });
    const expired = path.join(params.FULL_BACKUP_DIR, "expired.dnbackup");
    fs.writeFileSync(expired, "old");
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    fs.utimesSync(expired, hourAgo, hourAgo);

    const first = await createFullBackup({ password, encryptOptions: fast, deps });
    expect(fs.readdirSync(params.FULL_BACKUP_DIR)).to.deep.equal([first.fileName]);
    const second = await createFullBackup({ password, encryptOptions: fast, deps });
    expect(fs.readdirSync(params.FULL_BACKUP_DIR).sort()).to.deep.equal([first.fileName, second.fileName].sort());
  });

  it("never removes a staging dir kept as the last copy of removed validator keys", async () => {
    const kept = path.join(params.FULL_BACKUP_DIR, "full-backup-kept");
    fs.mkdirSync(kept, { recursive: true });
    fs.writeFileSync(path.join(kept, "KEEP-removed-validator-keys"), "");
    fs.writeFileSync(path.join(kept, "keystores.tar"), "keys");

    const { fileName } = await createFullBackup({ password, encryptOptions: fast, deps });
    expect(fs.readdirSync(params.FULL_BACKUP_DIR).sort()).to.deep.equal([fileName, "full-backup-kept"].sort());
    expect(fs.readFileSync(path.join(kept, "keystores.tar"), "utf8")).to.equal("keys");
  });

  it("keeps the state and the last result for a UI that lost the response", async () => {
    let inProgressWhileCopying = false;
    const spyDeps = recordingDeps([], {
      getArchive: async (containerName, archivePath) => {
        inProgressWhileCopying = getFullBackupStatus().inProgress && !getFullBackupStatus().last;
        return deps.getArchive(containerName, archivePath);
      }
    });
    const result = await createFullBackup({ password, encryptOptions: fast, deps: spyDeps });
    expect(inProgressWhileCopying).to.equal(true);
    const status = getFullBackupStatus();
    expect(status.inProgress).to.equal(false);
    expect(status.last?.result).to.deep.equal(result);
    expect(status.last?.error).to.equal(undefined);

    try {
      await createFullBackup({
        password,
        encryptOptions: fast,
        deps: {
          ...deps,
          listPackages: async () => {
            throw Error("docker is down");
          }
        }
      });
      throw Error("Expected an error");
    } catch (e) {
      expect((e as Error).message).to.equal("docker is down");
    }
    expect(getFullBackupStatus()).to.deep.include({ inProgress: false });
    expect(getFullBackupStatus().last).to.include({ error: "docker is down" });
    expect(getFullBackupStatus().last?.result).to.equal(undefined);

    // The download link of the last backup has expired
    sinon.useFakeTimers({ now: Date.now() + 31 * 60 * 1000, toFake: ["Date"] });
    expect(getFullBackupStatus()).to.deep.equal({ inProgress: false });
  });

  it("leaves validators untouched and their data out when asked to", async () => {
    writeManifest([
      { name: "keystores", path: "/data/keys" },
      { name: "slashing-protection", path: "/data/missing" }
    ]);
    const events: string[] = [];
    const result = await createFullBackup({
      password,
      skipValidatorData: true,
      encryptOptions: fast,
      deps: recordingDeps(events)
    });
    expect(events).to.deep.equal([]);
    expect(result).to.deep.include({ skippedValidators: [dnpName], stoppedValidators: [], warnings: [] });

    const entries = await readBackup(db.fileTransferPath.get(result.fileId) as string);
    const manifest = json(entries, "backup-manifest.json") as unknown as FullBackupManifest;
    const backup = manifest.packages[0].backup;
    expect(backup.map((item) => item.file)).to.deep.equal([undefined, undefined]);
    expect(backup[0].error).to.match(/kept running/);
    // Its settings are still there
    expect(entries.has(`packages/${dnpName}/user-settings.json`)).to.equal(true);
  });

  it("refuses to both leave validators out and keep them stopped", async () => {
    try {
      await createFullBackup({ password, keepValidatorsStopped: true, skipValidatorData: true, deps });
      throw Error("Expected an error");
    } catch (e) {
      expect((e as Error).message).to.match(/both left out of the backup and kept stopped/);
    }
    expect(getFullBackupStatus().inProgress).to.equal(false);
  });

  it("reports its progress while it runs and clears it when done", async () => {
    writeManifest([{ name: "slashing-protection", path: "/data/keys" }]);
    const seen: FullBackupProgress[] = [];
    const snapshot = (): void => {
      const { progress } = getFullBackupStatus();
      if (progress) seen.push(progress);
    };
    const spyDeps = recordingDeps([], {
      getHttpsMappings: async () => (snapshot(), deps.getHttpsMappings()),
      stopForBackup: async () => (snapshot(), async () => snapshot()),
      getArchive: async (containerName, archivePath) => (snapshot(), deps.getArchive(containerName, archivePath))
    });
    const result = await createFullBackup({ password, encryptOptions: fast, deps: spyDeps });

    expect(seen.map((p) => p.step)).to.deep.equal(["preparing", "stopping", "copying", "restarting"]);
    expect(seen[1]).to.deep.include({ dnpName, packagesDone: 0, packagesTotal: 1, copiedBytes: 0 });
    expect(seen[3]).to.deep.include({ dnpName, copiedBytes: "TAR-BYTES-OF-KEYS".length });
    expect(Date.parse(seen[0].startedAt)).to.be.closeTo(Date.now(), 60_000);
    expect(result.sizeBytes).to.be.greaterThan(0);
    expect(getFullBackupStatus().progress).to.equal(undefined);
  });

  it("restarts a validator even when copying fails", async () => {
    writeManifest([{ name: "keystores", path: "/data/keys" }]);
    const events: string[] = [];
    const failing = recordingDeps(events, {
      getArchive: async () => {
        throw Error("docker archive failed");
      }
    });
    const result = await createFullBackup({ password, encryptOptions: fast, deps: failing });
    expect(events).to.deep.equal([`stop ${dnpName}`, `restart ${dnpName}`]);
    expect(result.warnings.some((w) => w.includes("docker archive failed"))).to.equal(true);
  });

  it("never stops system packages, the dappmanager or Tailscale", () => {
    expect(canStopForBackup({ dnpName, isCore: false })).to.equal(true);
    expect(canStopForBackup({ dnpName: "wireguard.dnp.dappnode.eth", isCore: true })).to.equal(false);
    expect(canStopForBackup({ dnpName: "dappmanager.dnp.dappnode.eth", isCore: true })).to.equal(false);
    expect(canStopForBackup({ dnpName: "tailscale.dnp.dappnode.eth", isCore: false })).to.equal(false);
  });

  it("skips SQLite side files that are absent because the database was closed cleanly", async () => {
    writeManifest([
      { name: "db", path: "/data/keys" },
      { name: "db-wal", path: "/data/app.db-wal" }
    ]);
    const result = await createFullBackup({ password, encryptOptions: fast, deps });
    expect(result.warnings).to.deep.equal([]);
  });

  it("removes partial output and releases the lock when a step fails", async () => {
    const failingDeps = {
      ...deps,
      listPackages: async () => {
        throw Error("docker is down");
      }
    };
    try {
      await createFullBackup({ password, encryptOptions: fast, deps: failingDeps });
      throw Error("Expected an error");
    } catch (e) {
      expect((e as Error).message).to.equal("docker is down");
    }
    expect(fs.readdirSync(params.FULL_BACKUP_DIR)).to.deep.equal([]);
    // A following backup works, so the in-progress lock was released
    await createFullBackup({ password, encryptOptions: fast, deps });
  });
});
