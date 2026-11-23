import fs from "fs";
import path from "path";
import zlib from "zlib";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import tar from "tar-stream";
import { expect } from "chai";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { FullBackupManifest, InstalledPackageData, PackageContainer } from "@dappnode/types";
import { createFullBackup, FullBackupDeps, MANIFEST_ARCHIVE_PATH } from "../../../src/fullBackup/create.js";
import { createDecryptStream, EncryptOptions } from "../../../src/fullBackup/format.js";

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
  getHttpsMappings: async () => [{ fromSubdomain: "app", dnpName, serviceName: dnpName, port: 80, external: true }]
};

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
    fs.rmSync(params.TEMP_TRANSFER_DIR, { recursive: true, force: true });
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
    db.clearMainDb();
    db.clearCacheDb();
    fs.rmSync(params.TEMP_TRANSFER_DIR, { recursive: true, force: true });
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
    expect(filePath).to.equal(path.join(params.TEMP_TRANSFER_DIR, result.fileName));
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
    expect(json(entries, `packages/${dnpName}/user-settings.json`)).to.have.nested.property(
      `environment.${dnpName.replace(/\./g, "\\.")}.FOO`,
      "bar"
    );

    const mainDb = json(entries, "dappmanager/maindb.json");
    expect(mainDb).to.include({ "dappnode-web-name": "my node", "telegram-token": "telegram-secret" });
    expect(mainDb["dyndns-identity"]).to.deep.equal({ address: "0xabc", privateKey: "0xkey", publicKey: "0xpub" });
    expect(mainDb).to.not.have.property("double-nat");
    expect(json(entries, "dappmanager/cachedb.json")).to.deep.equal({ "is-nat-renewal-disabled": true });
    expect(json(entries, "dappmanager/admin-passwords.json")).to.deep.equal({ admin: "$2a$10$hash" });
    expect(json(entries, "dappmanager/https-mappings.json")).to.have.length(1);

    // Secrets never appear in plaintext and staging files are removed
    expect(fs.readFileSync(filePath as string).includes(Buffer.from("telegram-secret"))).to.equal(false);
    expect(fs.readdirSync(params.TEMP_TRANSFER_DIR)).to.deep.equal([result.fileName]);
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
    expect(fs.readdirSync(params.TEMP_TRANSFER_DIR)).to.deep.equal([]);
    // A following backup works, so the in-progress lock was released
    await createFullBackup({ password, encryptOptions: fast, deps });
  });
});
