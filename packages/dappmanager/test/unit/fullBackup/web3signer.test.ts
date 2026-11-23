import fs from "fs";
import path from "path";
import { Readable } from "stream";
import tar from "tar-stream";
import { expect } from "chai";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { InstalledPackageData, PackageContainer } from "@dappnode/types";
import { FullBackupDeps, writeFullBackup } from "../../../src/fullBackup/create.js";
import { EncryptOptions } from "../../../src/fullBackup/format.js";
import { readBackupManifest } from "../../../src/fullBackup/read.js";
import { inspectBackup } from "../../../src/fullBackup/plan.js";
import {
  getRestoreDir,
  getRestoreStatus,
  RestoreDeps,
  startRestore,
  waitForRestoreJob
} from "../../../src/fullBackup/restore.js";
import {
  BrainClient,
  BrainImportRequest,
  BackedUpKeystore,
  BrainRequestError,
  brainHostname,
  exportSlashingProtection,
  findKeystores,
  importKeysThroughBrain,
  readBrainSettings,
  SlashingExportError,
  SlashingInterchange,
  stoppedKeyServices
} from "../../../src/fullBackup/web3signer.js";
import { discardPendingBackup, getPendingBackupPath, listPendingBackups } from "../../../src/fullBackup/pending.js";

const fast: EncryptOptions = { kdf: { log2N: 14, r: 8, p: 1 } };
const password = "backup password 123";
const signer = "web3signer-hoodi.dnp.dappnode.eth";
const outDir = path.join(params.TEMP_TRANSFER_DIR, "web3signer-test");
const pendingDir = path.join(params.DNCORE_DIR, "full-backup-pending-test");
const rescueDir = path.join(params.DNCORE_DIR, "full-backup-rescue");
const pk1 = `0x${"a1".repeat(48)}`;
const pk2 = `0x${"b2".repeat(48)}`;
const fee1 = `0x${"11".repeat(20)}`;
const fee2 = `0x${"22".repeat(20)}`;

const keystoreJson = (pubkey: string): string => JSON.stringify({ pubkey: pubkey.slice(2), crypto: { kdf: {} } });
const keyfileYaml = (id: string, dir = "/data/keyfiles"): string =>
  `type: "file-keystore"\nkeystoreFile: "${dir}/${id}.json"\nkeystorePasswordFile: "${dir}/${id}.password"\nkeyType: "BLS"\n`;

async function tarOf(files: Record<string, string>, dirs: string[] = []): Promise<Buffer> {
  const pack = tar.pack();
  for (const dir of dirs) pack.entry({ name: dir, type: "directory" });
  for (const [name, content] of Object.entries(files)) pack.entry({ name }, content);
  pack.finalize();
  const chunks: Buffer[] = [];
  for await (const chunk of pack) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

/** Keystores folder as the docker archive API returns /data/keyfiles */
const keyfilesTar = (): Promise<Buffer> =>
  tarOf(
    {
      [`keyfiles/${pk1}.json`]: keystoreJson(pk1),
      [`keyfiles/${pk1}.password`]: "password-1",
      [`keyfiles/${pk1}.yaml`]: keyfileYaml(pk1),
      // Older install: config still points to /opt/web3signer/keyfiles, non-standard names
      "keyfiles/key-two.json": keystoreJson(pk2),
      "keyfiles/key-two.password": "password-2\n",
      "keyfiles/key-two.yaml": keyfileYaml("key-two", "/opt/web3signer/keyfiles")
    },
    ["keyfiles/"]
  );

const brainDbTar = (): Promise<Buffer> =>
  tarOf({
    "brain-db.json": JSON.stringify({
      [pk1]: { tag: "solo", feeRecipient: fee1, automaticImport: false },
      [pk2]: { tag: "lido", feeRecipient: fee2, automaticImport: true }
    })
  });

const interchangeOf = (pubkeys: string[]): SlashingInterchange => ({
  metadata: { interchange_format_version: "5", genesis_validators_root: "0x00" },
  data: pubkeys.map((pubkey) => ({ pubkey, signed_blocks: [{ slot: "100" }], signed_attestations: [] }))
});

/** In-memory Staking Brain + Web3Signer */
function fakeBrain(
  initialKeys: string[],
  {
    failDelete,
    loseDeleteResponse,
    failImport,
    keepAfterDelete,
    notFound,
    neverSigned,
    addDuringDelete,
    maxBodyBytes
  }: {
    failDelete?: boolean;
    /** The keys are deleted but the response never arrives */
    loseDeleteResponse?: boolean;
    failImport?: boolean;
    keepAfterDelete?: string[];
    /** Removed by someone else meanwhile: answered `not_found`, with no slashing protection */
    notFound?: string[];
    /** Web3Signer exports no entry for a key without signing history */
    neverSigned?: string[];
    /** A key imported by someone else while the delete runs */
    addDuringDelete?: string;
    /** Larger import requests are refused with HTTP 413, like the brain's body limit */
    maxBodyBytes?: number;
  } = {}
): { client: BrainClient; keys: Set<string>; events: string[]; imports: BrainImportRequest[] } {
  const keys = new Set(initialKeys);
  const events: string[] = [];
  const imports: BrainImportRequest[] = [];
  const client: BrainClient = {
    listKeys: async () => [...keys],
    deleteKeys: async (pubkeys) => {
      events.push(`delete ${pubkeys.length}`);
      if (failDelete) throw Error("signer timeout");
      if (addDuringDelete) keys.add(addDuringDelete);
      const data = pubkeys.map((pubkey) => {
        if (keepAfterDelete?.includes(pubkey)) return { status: "error", message: "readonly key" };
        keys.delete(pubkey);
        if (notFound?.includes(pubkey)) return { status: "not_found", message: "" };
        return { status: "deleted", message: "" };
      });
      if (loseDeleteResponse) throw Error("signer timeout");
      const deleted = pubkeys.filter(
        (pubkey) => ![keepAfterDelete, notFound, neverSigned].some((list) => list?.includes(pubkey))
      );
      return { data, slashing_protection: JSON.stringify(interchangeOf(deleted)) };
    },
    importKeys: async (request) => {
      events.push(`import ${request.keystores.length}`);
      if (maxBodyBytes && Buffer.byteLength(JSON.stringify(request)) > maxBodyBytes) {
        throw new BrainRequestError("request entity too large", 413);
      }
      imports.push(request);
      if (failImport) throw Error("brain busy");
      // Web3Signer imports slashing protection only for the keys it did not have
      const data = request.keystores.map((keystore) => {
        const pubkey = `0x${JSON.parse(keystore).pubkey}`;
        if (keys.has(pubkey)) return { status: "duplicate", message: "" };
        keys.add(pubkey);
        return { status: "imported", message: "" };
      });
      return { data };
    }
  };
  return { client, keys, events, imports };
}

/**
 * The package's services. `flyway` runs the database migrations once and
 * exits, and `tracker` takes no part in moving keys
 */
function signerContainers(running: boolean, stoppedServices: string[] = []): PackageContainer[] {
  return ["brain", "web3signer", "flyway", "postgres", "tracker"].map(
    (serviceName) =>
      ({
        containerName: `DAppNodePackage-${serviceName}.${signer}`,
        serviceName,
        dnpName: signer,
        running: running && serviceName !== "flyway" && !stoppedServices.includes(serviceName),
        volumes: []
      }) as unknown as PackageContainer
  );
}

const signerPkg = (running = true, version = "0.1.5", stoppedServices: string[] = []): InstalledPackageData =>
  ({
    dnpName: signer,
    version,
    isCore: false,
    containers: signerContainers(running, stoppedServices)
  }) as unknown as InstalledPackageData;

/** Running services of a freshly installed package, which a restore stops */
const RUNNING_SERVICES = 4;

function writeSignerFiles(): void {
  const dir = path.join(params.REPO_DIR, signer);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "docker-compose.yml"),
    `version: "3.5"\nservices:\n  brain:\n    image: brain:0.1.5\n  web3signer:\n    image: web3signer:0.1.5\n`
  );
  fs.writeFileSync(
    path.join(dir, "dappnode_package.json"),
    JSON.stringify({
      name: signer,
      version: "0.1.5",
      backup: [
        { name: "keystores", path: "/data/keyfiles", service: "web3signer" },
        { name: "brain-db", path: "/app/data/brain-db.json", service: "brain" }
      ]
    })
  );
}

function backupDeps(brain: BrainClient, events: string[], overrides: Partial<FullBackupDeps> = {}): FullBackupDeps {
  return {
    listPackages: async () => [signerPkg()],
    getArchive: async (_container, archivePath) => {
      events.push(`copy ${archivePath}`);
      if (archivePath === "/data/keyfiles") return Readable.from([await keyfilesTar()]);
      if (archivePath === "/app/data/brain-db.json") return Readable.from([await brainDbTar()]);
      throw Object.assign(Error("not found"), { statusCode: 404 });
    },
    getHttpsMappings: async () => [],
    stopForBackup: async (pkg) => {
      events.push(`stop ${pkg.dnpName}`);
      return async () => {
        events.push(`restart ${pkg.dnpName}`);
      };
    },
    brainClient: () => brain,
    waitForBrain: async () => undefined,
    ...overrides
  };
}

async function expectRejects(promise: Promise<unknown>, message: RegExp): Promise<Error> {
  try {
    await promise;
  } catch (e) {
    expect((e as Error).message).to.match(message);
    return e as Error;
  }
  throw Error("Expected rejection");
}

describe("fullBackup / web3signer", () => {
  describe("helpers", () => {
    it("pairs keystores with their passwords from the Web3Signer configs", async () => {
      const files = new Map<string, Buffer>();
      const extract = tar.extract();
      extract.on("entry", (header, stream, next) => {
        const chunks: Buffer[] = [];
        stream.on("data", (c: Buffer) => chunks.push(c));
        stream.on("end", () => {
          if (header.type === "file") files.set(header.name, Buffer.concat(chunks));
          next();
        });
      });
      Readable.from([await keyfilesTar()]).pipe(extract);
      await new Promise((resolve) => extract.on("finish", resolve));
      files.set("keyfiles/raw.yaml", Buffer.from(`type: "file-raw"\nprivateKey: "0x01"\n`));

      const { keystores, unsupported } = findKeystores(files, "/data/keyfiles");
      expect([...keystores.keys()].sort()).to.deep.equal([pk1, pk2]);
      expect(keystores.get(pk1)?.password).to.equal("password-1");
      // Web3Signer reads only the first line of a password file
      expect(keystores.get(pk2)?.password).to.equal("password-2");
      expect(keystores.get(pk2)?.keystore).to.equal(keystoreJson(pk2));
      expect(unsupported).to.deep.equal(["raw.yaml (file-raw)"]);
    });

    it("reads tags and fee recipients from the brain DB", async () => {
      const settings = readBrainSettings(
        new Map([
          [
            "brain-db.json",
            Buffer.from(
              JSON.stringify({ [pk1.toUpperCase().replace("0X", "0x")]: { tag: "solo", feeRecipient: fee1 } })
            )
          ]
        ])
      );
      expect(settings.get(pk1)).to.deep.equal({ tag: "solo", feeRecipient: fee1 });
    });

    it("reaches the brain through its dncore alias", () => {
      expect(brainHostname("web3signer-hoodi.dnp.dappnode.eth")).to.equal("brain.web3signer-hoodi.dappnode");
      expect(brainHostname("web3signer.dnp.dappnode.eth")).to.equal("brain.web3signer.dappnode");
    });

    it("reports keys a partial delete left loaded", async () => {
      const brain = fakeBrain([pk1, pk2], { keepAfterDelete: [pk2] });
      const error = (await expectRejects(
        exportSlashingProtection(brain.client, [pk1, pk2]),
        /1 of 2 .*readonly key/
      )) as SlashingExportError;
      expect(error.deletedPubkeys).to.deep.equal([pk1]);
      expect(error.interchange?.data.map((d) => d.pubkey)).to.deep.equal([pk1]);
    });

    it("treats keys missing after a failed delete as deleted", async () => {
      // pk1 was loaded when the delete started
      const brain = fakeBrain([pk2], { failDelete: true });
      const error = (await expectRejects(
        exportSlashingProtection(brain.client, [pk1, pk2]),
        /signer timeout/
      )) as SlashingExportError;
      expect(error.deletedPubkeys).to.deep.equal([pk1]);
    });

    it("fails the export when a key is no longer in Web3Signer, which exports nothing for it", async () => {
      const brain = fakeBrain([pk1, pk2], { notFound: [pk2] });
      const error = (await expectRejects(
        exportSlashingProtection(brain.client, [pk1, pk2]),
        /1 of 2 .*0xb2b2b2b2\.\.\.b2b2: Web3Signer no longer had it and exported no slashing protection for it/
      )) as SlashingExportError;
      // Only pk1 was removed by this export and must be imported back
      expect(error.deletedPubkeys).to.deep.equal([pk1]);
      expect(error.interchange?.data.map((d) => d.pubkey)).to.deep.equal([pk1]);
    });

    it("reports the removed keys Web3Signer had no signing history for", async () => {
      const brain = fakeBrain([pk1, pk2], { neverSigned: [pk2] });
      const result = await exportSlashingProtection(brain.client, [pk1, pk2]);
      expect(result.pubkeys).to.deep.equal([pk1, pk2]);
      expect(result.interchange?.data.map((d) => d.pubkey)).to.deep.equal([pk1]);
      expect(result.withoutHistory).to.deep.equal([pk2]);
    });

    it("deletes only the keys it is given and reports the ones added meanwhile", async () => {
      const brain = fakeBrain([pk1], { addDuringDelete: pk2 });
      const result = await exportSlashingProtection(brain.client, [pk1]);
      expect(result.pubkeys).to.deep.equal([pk1]);
      expect(result.notRemoved).to.deep.equal([pk2]);
      expect([...brain.keys]).to.deep.equal([pk2]);
    });

    it("imports in batches, each with the slashing protection of its own keys", async () => {
      const brain = fakeBrain([]);
      const pubkeys = Array.from({ length: 60 }, (_, i) => `0x${i.toString(16).padStart(2, "0").repeat(48)}`);
      const result = await importKeysThroughBrain(brain.client, {
        keystores: pubkeys.map((pubkey) => ({ pubkey, keystore: keystoreJson(pubkey), password: "p" })),
        settings: new Map([[pubkeys[0], { tag: "lido", feeRecipient: fee2 }]]),
        interchange: interchangeOf(pubkeys)
      });
      expect(brain.events).to.deep.equal(["import 50", "import 10"]);
      expect(result.imported).to.have.length(60);
      expect(result.withoutSettings).to.have.length(59);
      const second = JSON.parse(brain.imports[1].slashing_protection as string) as SlashingInterchange;
      expect(second.data.map((d) => d.pubkey)).to.deep.equal(pubkeys.slice(50));
      expect(brain.imports[0].tags[0]).to.equal("lido");
      expect(brain.imports[0].feeRecipients[0]).to.equal(fee2);
    });

    const manyKeys = (count: number): { pubkeys: string[]; keystores: BackedUpKeystore[] } => {
      const pubkeys = Array.from({ length: count }, (_, i) => `0x${i.toString(16).padStart(2, "0").repeat(48)}`);
      return {
        pubkeys,
        keystores: pubkeys.map((pubkey) => ({ pubkey, keystore: keystoreJson(pubkey), password: "p" }))
      };
    };
    /** An interchange whose entries weigh about `bytesPerKey` each once sent */
    const heavyInterchange = (pubkeys: string[], bytesPerKey: number): SlashingInterchange => ({
      ...interchangeOf([]),
      data: pubkeys.map((pubkey) => ({ pubkey, signed_blocks: [], signed_attestations: ["x".repeat(bytesPerKey)] }))
    });

    it("cuts import batches by size, under the brain's 8 MiB body limit", async () => {
      const brain = fakeBrain([], { maxBodyBytes: 8 * 1024 * 1024 });
      const { pubkeys, keystores } = manyKeys(20);
      const result = await importKeysThroughBrain(brain.client, {
        keystores,
        settings: new Map(),
        interchange: heavyInterchange(pubkeys, 1024 * 1024)
      });
      expect(result.failed).to.deep.equal([]);
      expect(result.imported).to.deep.equal(pubkeys);
      // 1 MiB of slashing history per key: 5 keys per request, none refused
      expect(brain.events).to.deep.equal(["import 5", "import 5", "import 5", "import 5"]);
      for (const request of brain.imports) {
        expect(Buffer.byteLength(JSON.stringify(request))).to.be.lessThan(6 * 1024 * 1024);
      }
    });

    it("sends smaller requests when the brain answers 413, and keeps them smaller", async () => {
      // An older brain accepts only 100 kB
      const brain = fakeBrain([], { maxBodyBytes: 100 * 1000 });
      const { pubkeys, keystores } = manyKeys(60);
      const result = await importKeysThroughBrain(brain.client, {
        keystores,
        settings: new Map(),
        interchange: heavyInterchange(pubkeys, 10 * 1000)
      });
      expect(result.failed).to.deep.equal([]);
      expect(result.imported).to.deep.equal(pubkeys);
      // Each refusal halves the size of every later request: 50 keys (about
      // 500 kB), then 250 kB, then 125 kB are refused, and nothing after that
      expect(brain.events[0]).to.equal("import 50");
      expect(brain.events.length - brain.imports.length).to.equal(3);
      expect(brain.events.slice(3).every((event) => Number(event.split(" ")[1]) <= 6)).to.equal(true);
      const imported = brain.imports.flatMap((request) =>
        (JSON.parse(request.slashing_protection as string) as SlashingInterchange).data.map((d) => d.pubkey)
      );
      expect(imported).to.deep.equal(pubkeys);
    });

    it("reports a key too large for any request without failing the others", async () => {
      const brain = fakeBrain([], { maxBodyBytes: 100 * 1000 });
      const { pubkeys, keystores } = manyKeys(3);
      const interchange = heavyInterchange(pubkeys, 1000);
      interchange.data[1].signed_attestations = ["x".repeat(200 * 1000)];
      const result = await importKeysThroughBrain(brain.client, { keystores, settings: new Map(), interchange });
      expect(result.imported).to.deep.equal([pubkeys[0], pubkeys[2]]);
      expect(result.failed).to.have.length(1);
      expect(result.failed[0]).to.match(/^0x01010101\.\.\.0101: .*larger than the Staking Brain accepts/);
    });

    it("does not count keys Web3Signer already had as imported with slashing protection", async () => {
      const brain = fakeBrain([pk2]);
      const result = await importKeysThroughBrain(brain.client, {
        keystores: [pk1, pk2].map((pubkey) => ({ pubkey, keystore: keystoreJson(pubkey), password: "p" })),
        settings: new Map(),
        interchange: interchangeOf([pk1, pk2])
      });
      expect(result.imported).to.deep.equal([pk1]);
      expect(result.duplicates).to.deep.equal([pk2]);
      expect(result.failed).to.deep.equal([]);
    });

    it("counts only the services that move keys as stopped", () => {
      // flyway has always exited
      expect(stoppedKeyServices(signerPkg())).to.deep.equal([]);
      expect(stoppedKeyServices(signerPkg(true, "0.1.5", ["web3signer", "tracker"]))).to.deep.equal(["web3signer"]);
      expect(stoppedKeyServices(signerPkg(false))).to.deep.equal(["brain", "web3signer", "postgres"]);
    });
  });

  describe("backup and restore", () => {
    let adminPasswordsBefore: string | null;

    before(() => {
      adminPasswordsBefore = fs.existsSync(params.ADMIN_PASSWORDS_JSON_FILE)
        ? fs.readFileSync(params.ADMIN_PASSWORDS_JSON_FILE, "utf8")
        : null;
    });

    beforeEach(() => {
      db.clearMainDb();
      db.clearCacheDb();
      fs.rmSync(getRestoreDir(), { recursive: true, force: true });
      fs.rmSync(outDir, { recursive: true, force: true });
      fs.rmSync(pendingDir, { recursive: true, force: true });
      fs.rmSync(rescueDir, { recursive: true, force: true });
      writeSignerFiles();
    });

    after(() => {
      db.clearMainDb();
      db.clearCacheDb();
      fs.rmSync(getRestoreDir(), { recursive: true, force: true });
      fs.rmSync(params.TEMP_TRANSFER_DIR, { recursive: true, force: true });
      fs.rmSync(path.join(params.REPO_DIR, signer), { recursive: true, force: true });
      fs.rmSync(pendingDir, { recursive: true, force: true });
      fs.rmSync(rescueDir, { recursive: true, force: true });
      if (adminPasswordsBefore === null) fs.rmSync(params.ADMIN_PASSWORDS_JSON_FILE, { force: true });
      else fs.writeFileSync(params.ADMIN_PASSWORDS_JSON_FILE, adminPasswordsBefore);
    });

    /** Folders a backup stages its files in, deleted when it ends */
    const stagingDirs = (): string[] =>
      fs.existsSync(params.TEMP_TRANSFER_DIR)
        ? fs.readdirSync(params.TEMP_TRANSFER_DIR).filter((name) => name.startsWith("full-backup-"))
        : [];

    it("a moving backup removes the keys through the brain and stores the interchange with the keystores", async () => {
      // The package's one-shot flyway service has exited, as always
      const brain = fakeBrain([pk1, pk2]);
      const events = brain.events;
      const result = await writeFullBackup({
        password,
        outDir,
        keepValidatorsStopped: true,
        encryptOptions: fast,
        deps: backupDeps(brain.client, events)
      });

      // Copied before the delete (it removes the keystore files), stopped after
      expect(events).to.deep.equal([
        "copy /data/keyfiles",
        "copy /app/data/brain-db.json",
        "delete 2",
        `stop ${signer}`
      ]);
      expect(brain.keys.size).to.equal(0);
      expect(result.stoppedValidators).to.deep.equal([signer]);
      expect(result.slashingProtectionExported).to.deep.equal([{ dnpName: signer, validatorCount: 2 }]);

      const manifest = await readBackupManifest(result.filePath, password);
      const entry = manifest.packages.find((p) => p.dnpName === signer);
      expect(entry?.slashingProtection).to.deep.equal({
        source: "staking-brain",
        file: `packages/${signer}/slashing-protection.json`,
        pubkeys: [pk1, pk2]
      });
      expect(entry?.backup.map((item) => item.file)).to.deep.equal([
        `packages/${signer}/backup/keystores.tar`,
        `packages/${signer}/backup/brain-db.tar`
      ]);

      const inspected = inspectBackup({ manifest, installed: [], dappmanagerVersion: undefined, arch: process.arch });
      const plan = inspected.plans.clone.packages.find((p) => p.dnpName === signer);
      expect(plan).to.include({ slashingProtection: "included", validatorKeyCount: 2, restoreData: true });
      expect(inspected.plans.clone.warnings.some((w) => w.includes("no slashing protection"))).to.equal(false);
    });

    it("a routine backup keeps the keys on this node and stores no slashing protection", async () => {
      const brain = fakeBrain([pk1, pk2]);
      const result = await writeFullBackup({
        password,
        outDir,
        encryptOptions: fast,
        deps: backupDeps(brain.client, brain.events)
      });
      expect(brain.events).to.not.include("delete 2");
      expect(brain.keys.size).to.equal(2);
      const manifest = await readBackupManifest(result.filePath, password);
      expect(manifest.packages[0].slashingProtection).to.equal(undefined);
      expect(result.slashingProtectionExported).to.deep.equal([]);
    });

    it("fails a moving backup when the brain cannot delete, and imports removed keys back", async () => {
      const brain = fakeBrain([pk1, pk2], { keepAfterDelete: [pk2] });
      await expectRejects(
        writeFullBackup({
          password,
          outDir,
          keepValidatorsStopped: true,
          encryptOptions: fast,
          deps: backupDeps(brain.client, brain.events)
        }),
        /1 of 2 validator keys were removed.*imported back/
      );
      // pk1 was put back with its exported slashing protection
      expect([...brain.keys].sort()).to.deep.equal([pk1, pk2]);
      expect(brain.imports).to.have.length(1);
      expect(brain.imports[0].passwords).to.deep.equal(["password-1"]);
      expect(brain.imports[0].feeRecipients).to.deep.equal([fee1]);
      expect(JSON.parse(brain.imports[0].slashing_protection as string).data[0].pubkey).to.equal(pk1);
      expect(fs.existsSync(outDir) ? fs.readdirSync(outDir) : []).to.deep.equal([]);
    });

    it("keeps the removed keys on disk if they cannot be imported back", async () => {
      // The first Web3Signer exports, the second fails: the first must be undone
      const gnosis = "web3signer-gnosis.dnp.dappnode.eth";
      const brain = fakeBrain([pk1, pk2], { failImport: true });
      const gnosisBrain = fakeBrain([pk1], { failDelete: true });
      const deps = backupDeps(brain.client, brain.events, {
        listPackages: async () => [signerPkg(), { ...signerPkg(), dnpName: gnosis }],
        brainClient: (dnpName) => (dnpName === gnosis ? gnosisBrain.client : brain.client)
      });
      fs.mkdirSync(path.join(params.REPO_DIR, gnosis), { recursive: true });
      fs.cpSync(path.join(params.REPO_DIR, signer), path.join(params.REPO_DIR, gnosis), { recursive: true });
      try {
        const error = await expectRejects(
          writeFullBackup({ password, outDir, keepValidatorsStopped: true, encryptOptions: fast, deps }),
          /signer timeout.*could not be imported back/
        );
        expect(error.message).to.include("full-backup-rescue");
      } finally {
        fs.rmSync(path.join(params.REPO_DIR, gnosis), { recursive: true, force: true });
      }
      // Restarted to import the keys back
      expect(brain.events).to.include(`restart ${signer}`);
      const rescue = fs.readdirSync(rescueDir);
      expect(rescue).to.have.length(1);
      expect(fs.readdirSync(path.join(rescueDir, rescue[0])).sort()).to.deep.equal([
        "brain-db.tar",
        "keystores.tar",
        "slashing-protection.json"
      ]);
      expect(stagingDirs()).to.deep.equal([]);
    });

    it("says so when the removed keys were kept without slashing protection", async () => {
      // The keys are deleted but the answer with their interchange is lost
      const brain = fakeBrain([pk1, pk2], { loseDeleteResponse: true, failImport: true });
      const error = await expectRejects(
        writeFullBackup({
          password,
          outDir,
          keepValidatorsStopped: true,
          encryptOptions: fast,
          deps: backupDeps(brain.client, brain.events)
        }),
        /signer timeout.*could not be imported back/
      );
      expect(error.message).to.match(
        /Their keystores and Staking Brain DB \(their slashing protection was not exported\) were kept in DNCORE\/full-backup-rescue\//
      );
      const rescue = fs.readdirSync(rescueDir);
      expect(fs.readdirSync(path.join(rescueDir, rescue[0])).sort()).to.deep.equal(["brain-db.tar", "keystores.tar"]);
    });

    it("keeps the staged copies when the removed keys cannot be copied to DNCORE either", async () => {
      // Neither the pending backup nor the rescue folder can be written
      fs.mkdirSync(params.DNCORE_DIR, { recursive: true });
      fs.writeFileSync(rescueDir, "not a folder");
      const brain = fakeBrain([pk1, pk2], { failImport: true });
      let staged: string | undefined;
      try {
        const error = await expectRejects(
          writeFullBackup({
            password,
            outDir,
            keepValidatorsStopped: true,
            pendingDir: path.join(rescueDir, "pending"),
            encryptOptions: fast,
            deps: backupDeps(brain.client, brain.events)
          }),
          /could not be imported back.*They could not be copied to DNCORE\/full-backup-rescue/
        );
        expect(error.message).to.not.include("were kept in DNCORE");
        staged = /were left in (\S+) inside the dappmanager/.exec(error.message)?.[1];
        expect(staged, error.message).to.be.a("string");
        // The last copy of the keys is where the error says, complete
        expect(fs.readdirSync(staged as string).sort()).to.deep.equal([
          "brain-db.tar",
          "keystores.tar",
          "slashing-protection.json"
        ]);
        expect(fs.statSync(path.join(staged as string, "keystores.tar")).size).to.equal((await keyfilesTar()).length);
        expect(
          JSON.parse(fs.readFileSync(path.join(staged as string, "slashing-protection.json"), "utf8"))
        ).to.deep.equal(interchangeOf([pk1, pk2]));
      } finally {
        for (const dir of stagingDirs()) fs.rmSync(path.join(params.TEMP_TRANSFER_DIR, dir), { recursive: true });
      }
    });

    it("refuses a moving backup while Web3Signer is stopped, before changing anything", async () => {
      const brain = fakeBrain([pk1, pk2]);
      await expectRejects(
        writeFullBackup({
          password,
          outDir,
          keepValidatorsStopped: true,
          encryptOptions: fast,
          deps: backupDeps(brain.client, brain.events, { listPackages: async () => [signerPkg(false)] })
        }),
        /is not running \(brain, web3signer, postgres\)/
      );
      expect(brain.events).to.deep.equal([]);
    });

    it("refuses a moving backup while one of the services that move keys is stopped", async () => {
      const brain = fakeBrain([pk1, pk2]);
      await expectRejects(
        writeFullBackup({
          password,
          outDir,
          keepValidatorsStopped: true,
          encryptOptions: fast,
          deps: backupDeps(brain.client, brain.events, {
            listPackages: async () => [signerPkg(true, "0.1.5", ["postgres"])]
          })
        }),
        /is not running \(postgres\)/
      );
      expect(brain.events).to.deep.equal([]);
    });

    it("copies a stopped Web3Signer without manifest backup items like any other package", async () => {
      // An older package: nothing to copy, so no keys are removed and it does not have to run
      const manifestPath = path.join(params.REPO_DIR, signer, "dappnode_package.json");
      fs.writeFileSync(manifestPath, JSON.stringify({ name: signer, version: "0.1.5" }));
      const brain = fakeBrain([pk1, pk2]);
      const result = await writeFullBackup({
        password,
        outDir,
        keepValidatorsStopped: true,
        pendingDir,
        encryptOptions: fast,
        deps: backupDeps(brain.client, brain.events, { listPackages: async () => [signerPkg(false)] })
      });
      // Left stopped like any other validator, without a call to its brain
      expect(brain.events).to.deep.equal([`stop ${signer}`]);
      expect(brain.keys.size).to.equal(2);
      expect(result.slashingProtectionExported).to.deep.equal([]);
      expect(listPendingBackups(pendingDir)).to.deep.equal([]);
    });

    it("removes no key when the copied keystores cannot restore every loaded key", async () => {
      // pk2's password file is missing, and a raw key cannot be imported through the brain
      const incomplete = await tarOf(
        {
          [`keyfiles/${pk1}.json`]: keystoreJson(pk1),
          [`keyfiles/${pk1}.password`]: "password-1",
          [`keyfiles/${pk1}.yaml`]: keyfileYaml(pk1),
          [`keyfiles/${pk2}.json`]: keystoreJson(pk2),
          [`keyfiles/${pk2}.yaml`]: keyfileYaml(pk2),
          "keyfiles/raw.yaml": `type: "file-raw"\nprivateKey: "0x01"\n`
        },
        ["keyfiles/"]
      );
      const brain = fakeBrain([pk1, pk2]);
      const error = await expectRejects(
        writeFullBackup({
          password,
          outDir,
          keepValidatorsStopped: true,
          encryptOptions: fast,
          deps: backupDeps(brain.client, brain.events, {
            getArchive: async (_container, archivePath) =>
              Readable.from([archivePath === "/data/keyfiles" ? incomplete : await brainDbTar()])
          })
        }),
        /1 of the 2 validator keys loaded in Web3Signer have no keystore with its password.*0xb2b2b2b2\.\.\.b2b2/
      );
      expect(error.message).to.include("raw.yaml (file-raw)");
      expect(error.message).to.include("Nothing was removed from it");
      // Nothing deleted, so nothing to import back either
      expect(brain.events).to.deep.equal([]);
      expect([...brain.keys].sort()).to.deep.equal([pk1, pk2]);
      expect(fs.existsSync(outDir) ? fs.readdirSync(outDir) : []).to.deep.equal([]);
    });

    it("leaves a key added while the backup runs on the node, and warns that it is not in the backup", async () => {
      const pk3 = `0x${"c3".repeat(48)}`;
      const brain = fakeBrain([pk1, pk2], { addDuringDelete: pk3 });
      const result = await writeFullBackup({
        password,
        outDir,
        keepValidatorsStopped: true,
        encryptOptions: fast,
        deps: backupDeps(brain.client, brain.events)
      });
      expect([...brain.keys]).to.deep.equal([pk3]);
      expect(result.slashingProtectionExported).to.deep.equal([{ dnpName: signer, validatorCount: 2 }]);
      expect(
        result.warnings.filter((w) => /1 validator keys were added.*0xc3c3c3c3.*not in the backup/.test(w))
      ).to.have.length(1);
    });

    it("fails a moving backup when a key is gone before it is removed, and imports the removed ones back", async () => {
      const brain = fakeBrain([pk1, pk2], { notFound: [pk2] });
      await expectRejects(
        writeFullBackup({
          password,
          outDir,
          keepValidatorsStopped: true,
          encryptOptions: fast,
          deps: backupDeps(brain.client, brain.events)
        }),
        /exported no slashing protection for it.*its 1 validator keys were imported back/
      );
      // pk2 was removed by someone else: it is not brought back
      expect([...brain.keys]).to.deep.equal([pk1]);
      expect(fs.existsSync(outDir) ? fs.readdirSync(outDir) : []).to.deep.equal([]);
    });

    it("keeps a moving backup on the node until it is discarded", async () => {
      const brain = fakeBrain([pk1, pk2]);
      const result = await writeFullBackup({
        password,
        outDir,
        keepValidatorsStopped: true,
        pendingDir,
        encryptOptions: fast,
        deps: backupDeps(brain.client, brain.events)
      });
      const backup = fs.readFileSync(result.filePath);

      // The download is used up, or it expired
      fs.rmSync(result.filePath);
      const pending = listPendingBackups(pendingDir);
      expect(pending).to.have.length(1);
      expect(pending[0]).to.include({ fileName: result.fileName, sizeBytes: backup.length });
      expect(pending[0].slashingProtectionExported).to.deep.equal([{ dnpName: signer, validatorCount: 2 }]);
      const kept = getPendingBackupPath(result.fileName, pendingDir);
      expect(fs.readFileSync(kept).equals(backup)).to.equal(true);
      expect((await readBackupManifest(kept, password)).packages[0].slashingProtection?.pubkeys).to.deep.equal([
        pk1,
        pk2
      ]);

      expect(() => getPendingBackupPath("../maindb.json", pendingDir)).to.throw("Invalid backup file name");
      expect(() => getPendingBackupPath("other.dnbackup", pendingDir)).to.throw("No backup named");
      discardPendingBackup(result.fileName, pendingDir);
      expect(listPendingBackups(pendingDir)).to.deep.equal([]);
      expect(fs.readdirSync(pendingDir)).to.deep.equal([]);
    });

    it("keeps no copy of a backup that removed no keys", async () => {
      for (const keepValidatorsStopped of [false, true]) {
        // Moving a node whose Web3Signer has no keys removes nothing either
        const brain = fakeBrain(keepValidatorsStopped ? [] : [pk1, pk2]);
        await writeFullBackup({
          password,
          outDir,
          keepValidatorsStopped,
          pendingDir,
          encryptOptions: fast,
          deps: backupDeps(brain.client, brain.events)
        });
        expect(listPendingBackups(pendingDir)).to.deep.equal([]);
      }
    });

    it("fails a moving backup, and imports the keys back, when it cannot be kept on the node", async () => {
      fs.mkdirSync(params.DNCORE_DIR, { recursive: true });
      fs.writeFileSync(pendingDir, "not a folder");
      const brain = fakeBrain([pk1, pk2]);
      await expectRejects(
        writeFullBackup({
          password,
          outDir,
          keepValidatorsStopped: true,
          pendingDir,
          encryptOptions: fast,
          deps: backupDeps(brain.client, brain.events)
        }),
        /Could not keep a copy of the backup on this node.*its 2 validator keys were imported back/
      );
      expect([...brain.keys].sort()).to.deep.equal([pk1, pk2]);
      expect(fs.readdirSync(outDir)).to.deep.equal([]);
      expect(stagingDirs()).to.deep.equal([]);
    });

    /** Fake node with a fresh install of Web3Signer, records every effect */
    function fakeNode(
      brain: BrainClient,
      initial: InstalledPackageData[] = []
    ): { deps: RestoreDeps; calls: string[] } {
      const packages = new Map(initial.map((p) => [p.dnpName, p]));
      const calls: string[] = [];
      const deps: RestoreDeps = {
        listPackages: async () => [...packages.values()],
        installPackage: async ({ dnpName, version, start }) => {
          calls.push(`install ${dnpName}${start ? "" : " stopped"}`);
          packages.set(dnpName, signerPkg(start, version));
        },
        applySettings: async ({ dnpName, start }) => {
          calls.push(`apply ${dnpName}${start ? "" : " stopped"}`);
        },
        startPackage: async (dnpName) => {
          calls.push(`start ${dnpName}`);
        },
        removePackage: async (dnpName) => {
          calls.push(`remove ${dnpName}`);
        },
        pathExists: async () => true,
        putArchive: async (containerName, dirPath) => {
          calls.push(`put ${containerName} ${dirPath}`);
        },
        stopContainer: async (name) => {
          calls.push(`stop ${name}`);
        },
        getHttpsMappings: async () => [],
        addHttpsMapping: async () => undefined,
        writeSafetySnapshot: async () => "DNCORE/full-backup-snapshots/snapshot.dnbackup",
        getGlobalEnvs: () => ({}),
        refreshGlobalEnvFile: () => undefined,
        applyStakerSelections: async () => undefined,
        progress: () => undefined,
        clearProgress: () => undefined,
        brainClient: () => brain,
        waitForBrain: async () => {
          calls.push("wait brain");
        }
      };
      return { deps, calls };
    }

    it("restores a moving backup by importing the keys through the brain, without writing keystore files", async () => {
      const oldNode = fakeBrain([pk1, pk2]);
      const { filePath } = await writeFullBackup({
        password,
        outDir,
        keepValidatorsStopped: true,
        encryptOptions: fast,
        deps: backupDeps(oldNode.client, oldNode.events)
      });

      const newNode = fakeBrain([]);
      const { deps, calls } = fakeNode(newNode.client);
      await startRestore({ filePath, password, mode: "clone", confirmValidatorsOff: true, deps });
      await waitForRestoreJob();

      const status = getRestoreStatus();
      expect(status.status, JSON.stringify(status.steps)).to.equal("done");
      // Installed running with no keys, keys imported, then stopped
      expect(calls.indexOf(`install ${signer}`)).to.be.lessThan(calls.indexOf("wait brain"));
      expect(calls.some((c) => c.startsWith("put "))).to.equal(false);
      expect(calls.filter((c) => c.startsWith("stop "))).to.have.length(RUNNING_SERVICES);
      expect(status.stoppedValidators).to.deep.equal([signer]);

      expect(newNode.imports).to.have.length(1);
      const request = newNode.imports[0];
      expect(request.keystores.map((k) => `0x${JSON.parse(k).pubkey}`)).to.deep.equal([pk1, pk2]);
      expect(request.passwords).to.deep.equal(["password-1", "password-2"]);
      expect(request.tags).to.deep.equal(["solo", "lido"]);
      expect(request.feeRecipients).to.deep.equal([fee1, fee2]);
      expect(JSON.parse(request.slashing_protection as string)).to.deep.equal(interchangeOf([pk1, pk2]));
      expect([...newNode.keys].sort()).to.deep.equal([pk1, pk2]);
    });

    it("fails the package step and leaves it stopped when the brain import fails", async () => {
      const oldNode = fakeBrain([pk1, pk2]);
      const { filePath } = await writeFullBackup({
        password,
        outDir,
        keepValidatorsStopped: true,
        encryptOptions: fast,
        deps: backupDeps(oldNode.client, oldNode.events)
      });
      const newNode = fakeBrain([], { failImport: true });
      const { deps, calls } = fakeNode(newNode.client);
      await startRestore({ filePath, password, mode: "clone", confirmValidatorsOff: true, deps });
      await waitForRestoreJob();

      const status = getRestoreStatus();
      expect(status.status).to.equal("failed");
      expect(status.steps.find((s) => s.id === `package:${signer}`)?.error).to.match(/0 of 2 .*brain busy/);
      expect(calls.filter((c) => c.startsWith("stop "))).to.have.length(RUNNING_SERVICES);
      expect(status.stoppedValidators).to.deep.equal([signer]);
    });

    it("does not start a Web3Signer that is stopped on this node to import keys", async () => {
      const oldNode = fakeBrain([pk1]);
      const { filePath } = await writeFullBackup({
        password,
        outDir,
        keepValidatorsStopped: true,
        encryptOptions: fast,
        deps: backupDeps(oldNode.client, oldNode.events)
      });
      const newNode = fakeBrain([]);
      const { deps, calls } = fakeNode(newNode.client, [signerPkg(false)]);
      await startRestore({ filePath, password, mode: "merge", confirmValidatorsOff: true, deps });
      await waitForRestoreJob();
      expect(getRestoreStatus().steps.find((s) => s.id === `package:${signer}`)?.error).to.match(
        /is stopped on this node/
      );
      expect(calls).to.deep.equal([]);
      expect(newNode.imports).to.deep.equal([]);
    });

    it("does not start a web3signer service that is stopped on this node", async () => {
      const oldNode = fakeBrain([pk1]);
      const { filePath } = await writeFullBackup({
        password,
        outDir,
        keepValidatorsStopped: true,
        encryptOptions: fast,
        deps: backupDeps(oldNode.client, oldNode.events)
      });
      const newNode = fakeBrain([]);
      // The brain and Postgres run, but the user stopped the signer itself
      const { deps, calls } = fakeNode(newNode.client, [signerPkg(true, "0.1.5", ["web3signer"])]);
      await startRestore({ filePath, password, mode: "merge", confirmValidatorsOff: true, deps });
      await waitForRestoreJob();
      expect(getRestoreStatus().steps.find((s) => s.id === `package:${signer}`)?.error).to.match(
        /is stopped on this node \(web3signer not running\)/
      );
      expect(calls).to.deep.equal([]);
      expect(newNode.imports).to.deep.equal([]);
    });

    it("leaves a Web3Signer running on this node as it is when the backup has no keys for it", async () => {
      const oldNode = fakeBrain([]);
      const { filePath } = await writeFullBackup({
        password,
        outDir,
        keepValidatorsStopped: true,
        encryptOptions: fast,
        deps: backupDeps(oldNode.client, oldNode.events)
      });
      const manifest = await readBackupManifest(filePath, password);
      expect(manifest.packages[0].slashingProtection).to.deep.equal({ source: "staking-brain", pubkeys: [] });

      // This node validates with its own keys
      const newNode = fakeBrain([pk1]);
      const { deps, calls } = fakeNode(newNode.client, [signerPkg()]);
      await startRestore({ filePath, password, mode: "merge", confirmValidatorsOff: true, deps });
      await waitForRestoreJob();

      const status = getRestoreStatus();
      expect(status.status, JSON.stringify(status.steps)).to.equal("done");
      expect(calls.filter((c) => c.startsWith("stop ") || c.startsWith("put ") || c === "wait brain")).to.deep.equal(
        []
      );
      expect(status.stoppedValidators).to.deep.equal([]);
      expect(newNode.imports).to.deep.equal([]);
      expect([...newNode.keys]).to.deep.equal([pk1]);
    });

    it("warns that keys already loaded on this node did not get the backup's slashing protection", async () => {
      const oldNode = fakeBrain([pk1, pk2]);
      const { filePath } = await writeFullBackup({
        password,
        outDir,
        keepValidatorsStopped: true,
        encryptOptions: fast,
        deps: backupDeps(oldNode.client, oldNode.events)
      });
      const newNode = fakeBrain([pk2]);
      const { deps } = fakeNode(newNode.client, [signerPkg()]);
      await startRestore({ filePath, password, mode: "merge", confirmValidatorsOff: true, deps });
      await waitForRestoreJob();

      const status = getRestoreStatus();
      expect(status.status, JSON.stringify(status.steps)).to.equal("done");
      const warnings = status.warnings.filter((w) => w.includes("already loaded in this node's Web3Signer"));
      expect(warnings).to.have.length(1);
      expect(warnings[0]).to.match(
        /1 validator keys .*0xb2b2b2b2\.\.\.b2b2.*slashing protection was not applied to them/
      );
      expect([...newNode.keys].sort()).to.deep.equal([pk1, pk2]);
    });

    it("says which keys have no slashing protection because they had never signed", async () => {
      const oldNode = fakeBrain([pk1, pk2], { neverSigned: [pk2] });
      const backup = await writeFullBackup({
        password,
        outDir,
        keepValidatorsStopped: true,
        encryptOptions: fast,
        deps: backupDeps(oldNode.client, oldNode.events)
      });
      const noHistory = /0xb2b2b2b2\.\.\.b2b2.*no slashing protection for them.*only if they have never validated/;
      expect(backup.warnings.filter((w) => /no signing history for 1 of/.test(w) && noHistory.test(w))).to.have.length(
        1
      );

      const newNode = fakeBrain([]);
      const { deps } = fakeNode(newNode.client);
      await startRestore({ filePath: backup.filePath, password, mode: "clone", confirmValidatorsOff: true, deps });
      await waitForRestoreJob();

      const status = getRestoreStatus();
      expect(status.status, JSON.stringify(status.steps)).to.equal("done");
      expect(
        status.warnings.filter((w) => /no slashing protection for 1 of .*0xb2b2b2b2.*had no signing history/.test(w))
      ).to.have.length(1);
      // Both keys are imported; the interchange sent has only what Web3Signer exported
      expect([...newNode.keys].sort()).to.deep.equal([pk1, pk2]);
      expect(JSON.parse(newNode.imports[0].slashing_protection as string)).to.deep.equal(interchangeOf([pk1]));
    });

    it("restores a routine backup's keystores, keeps the package stopped and warns about slashing protection", async () => {
      const oldNode = fakeBrain([pk1, pk2]);
      const { filePath } = await writeFullBackup({
        password,
        outDir,
        encryptOptions: fast,
        deps: backupDeps(oldNode.client, oldNode.events)
      });
      const manifest = await readBackupManifest(filePath, password);
      const inspected = inspectBackup({ manifest, installed: [], dappmanagerVersion: undefined, arch: process.arch });
      expect(inspected.plans.clone.packages[0]).to.include({ slashingProtection: "missing", restoreData: true });

      const newNode = fakeBrain([]);
      const { deps, calls } = fakeNode(newNode.client);
      await startRestore({ filePath, password, mode: "clone", confirmValidatorsOff: true, deps });
      await waitForRestoreJob();

      const status = getRestoreStatus();
      expect(status.status, JSON.stringify(status.steps)).to.equal("done");
      expect(calls).to.include(`install ${signer} stopped`);
      expect(calls).to.include(`put DAppNodePackage-web3signer.${signer} /data`);
      expect(calls).to.include(`put DAppNodePackage-brain.${signer} /app/data`);
      expect(calls).to.not.include(`start ${signer}`);
      expect(newNode.imports).to.deep.equal([]);
      expect(status.stoppedValidators).to.deep.equal([signer]);
      expect(status.warnings.some((w) => w.includes("no slashing protection") && w.includes("2 epochs"))).to.equal(
        true
      );
    });
  });
});
