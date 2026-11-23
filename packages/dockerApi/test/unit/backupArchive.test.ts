import "mocha";
import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { Readable } from "stream";
import tar from "tar-stream";
import {
  backupItemToContainerPath,
  readBackupArchive,
  renameTarRoot,
  tarCopyEntries,
  tarListTopLevelNames,
  writeBackupArchive
} from "../../src/backupArchive.js";

type TestEntry = { header: tar.Headers & { pax?: Record<string, string> }; content?: string };

const mtime = new Date("2024-01-02T03:04:05Z");

/** Builds a tar in memory */
async function buildTar(entries: TestEntry[]): Promise<Buffer> {
  const pack = tar.pack();
  for (const { header, content } of entries) {
    await new Promise<void>((resolve, reject) =>
      pack.entry({ mtime, ...header }, content ?? "", (err) => (err ? reject(err) : resolve()))
    );
  }
  pack.finalize();
  return streamToBuffer(pack);
}

/** Reads all entries of a tar with their headers and contents */
async function readTar(input: NodeJS.ReadableStream): Promise<TestEntry[]> {
  const entries: TestEntry[] = [];
  const extract = tar.extract();
  extract.on("entry", async (header, stream, next) => {
    const content = (await streamToBuffer(stream)).toString();
    entries.push({ header, content });
    next();
  });
  await new Promise((resolve, reject) => {
    extract.on("finish", resolve);
    extract.on("error", reject);
    input.pipe(extract);
  });
  return entries;
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

/** Copies a tar through tarCopyEntries and returns the resulting entries */
async function copyTar(input: Buffer, mapPath: (name: string) => string | null): Promise<TestEntry[]> {
  const pack = tar.pack();
  const reading = readTar(pack);
  await tarCopyEntries(Readable.from([input]), pack, mapPath);
  pack.finalize();
  return reading;
}

const longName = `keys/${"a".repeat(60)}/${"b".repeat(60)}.json`;

/** Similar to what the docker API returns for GET /containers/{id}/archive?path=/data/keys */
const dockerArchiveEntries: TestEntry[] = [
  { header: { name: "keys/", type: "directory", mode: 0o700, uid: 1000, gid: 100 } },
  { header: { name: "keys/key1.json", type: "file", mode: 0o600, uid: 1000, gid: 100 }, content: "secret" },
  { header: { name: "keys/run.sh", type: "file", mode: 0o4755, uid: 65534, gid: 65534 }, content: "#!/bin/sh" },
  { header: { name: "keys/latest", type: "symlink", linkname: "key1.json", mode: 0o777, uid: 1000, gid: 100 } },
  { header: { name: "keys/hardlink", type: "link", linkname: "keys/key1.json", mode: 0o600, uid: 1000, gid: 100 } },
  { header: { name: longName, type: "file", mode: 0o640, uid: 1000, gid: 100 }, content: "long" },
  {
    header: {
      name: "keys/cap",
      type: "file",
      mode: 0o755,
      uid: 1000,
      gid: 100,
      pax: { "SCHILY.xattr.user.test": "value", "SCHILY.xattr.com.apple.provenance": "mac" }
    },
    content: "xattr"
  }
];

describe("dockerApi > backupArchive", () => {
  let tmpDir: string;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "backup-archive-test-"));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("renameTarRoot", () => {
    it("renames the root entry of a docker archive keeping uid, gid, mode, mtime and contents", async () => {
      const entries = await copyTar(await buildTar(dockerArchiveEntries), renameTarRoot("validator-keys"));

      expect(entries.map((e) => e.header.name)).to.deep.equal([
        "validator-keys/",
        "validator-keys/key1.json",
        "validator-keys/run.sh",
        "validator-keys/latest",
        "validator-keys/hardlink",
        longName.replace("keys/", "validator-keys/"),
        "validator-keys/cap"
      ]);

      for (const [i, { header, content }] of entries.entries()) {
        const original = dockerArchiveEntries[i];
        expect(header.type).to.equal(original.header.type, header.name);
        expect(header.mode).to.equal(original.header.mode, header.name);
        expect(header.uid).to.equal(original.header.uid, header.name);
        expect(header.gid).to.equal(original.header.gid, header.name);
        expect(header.mtime?.getTime()).to.equal(mtime.getTime(), header.name);
        if (original.header.type === "file") expect(content).to.equal(original.content, header.name);
      }

      const byName = Object.fromEntries(entries.map((e) => [e.header.name, e.header]));
      // Symlink targets are kept, hard links follow the renamed entry
      expect(byName["validator-keys/latest"].linkname).to.equal("key1.json");
      expect(byName["validator-keys/hardlink"].linkname).to.equal("validator-keys/key1.json");
      // pax records other than the path are kept, except xattrs Linux cannot set
      const capPax = (byName["validator-keys/cap"] as TestEntry["header"]).pax;
      expect(capPax).to.deep.include({ path: "validator-keys/cap", "SCHILY.xattr.user.test": "value" });
      expect(capPax).to.not.have.property("SCHILY.xattr.com.apple.provenance");
    });

    it("renames a single file archive", async () => {
      const input = await buildTar([
        { header: { name: "config.yml", type: "file", mode: 0o600, uid: 1000, gid: 1000 }, content: "a: 1" }
      ]);
      const entries = await copyTar(input, renameTarRoot("config"));
      expect(entries.map((e) => [e.header.name, e.header.uid, e.header.mode, e.content])).to.deep.equal([
        ["config", 1000, 0o600, "a: 1"]
      ]);
    });

    it("keeps uids and gids too large for the headers tar-stream writes", async () => {
      // tar-stream writes 6 octal digits, other tars use the 7 the field fits
      const input = await buildTar([
        { header: { name: "data", type: "file", uid: 1, gid: 1, mode: 0o600 }, content: "x" }
      ]);
      input.write("1111111\0", 108, "ascii"); // uid 299593
      input.write("1111112\0", 116, "ascii"); // gid 299594
      input.write("        ", 148, "ascii");
      const checksum = input.subarray(0, 512).reduce((sum, byte) => sum + byte, 0);
      input.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148, "ascii");

      const entries = await copyTar(input, renameTarRoot("item"));
      const header = entries[0].header as TestEntry["header"];
      expect(header.name).to.equal("item");
      expect(header.pax).to.deep.include({ uid: "299593", gid: "299594" });
    });

    it("rejects archives with more than one top level entry", async () => {
      const input = await buildTar([
        { header: { name: "a", type: "file" }, content: "a" },
        { header: { name: "b", type: "file" }, content: "b" }
      ]);
      const pack = tar.pack();
      pack.resume();
      let error: Error | null = null;
      await tarCopyEntries(Readable.from([input]), pack, renameTarRoot("item")).catch((e) => (error = e));
      expect(error).to.be.instanceOf(Error);
      expect(error!.message).to.include("outside of a");
    });
  });

  describe("backupItemToContainerPath", () => {
    const backupEntries: TestEntry[] = [
      { header: { name: "config", type: "file", mode: 0o600, uid: 1000, gid: 1000 }, content: "a: 1" },
      { header: { name: "keys/", type: "directory", mode: 0o700, uid: 1000, gid: 100 } },
      { header: { name: "keys/key1.json", type: "file", mode: 0o600, uid: 1000, gid: 100 }, content: "secret" },
      { header: { name: "keys/hardlink", type: "link", linkname: "keys/key1.json", uid: 1000, gid: 100 } },
      { header: { name: "keysother/file", type: "file" }, content: "other" }
    ];

    it("places a directory item at its absolute path without parent directory entries", async () => {
      const entries = await copyTar(
        await buildTar(backupEntries),
        backupItemToContainerPath("keys", "/data/keys", "/")
      );
      expect(entries.map((e) => [e.header.name, e.header.uid, e.header.gid, e.header.mode])).to.deep.equal([
        ["data/keys/", 1000, 100, 0o700],
        ["data/keys/key1.json", 1000, 100, 0o600],
        ["data/keys/hardlink", 1000, 100, 0o644]
      ]);
      expect(entries[2].header.linkname).to.equal("data/keys/key1.json");
    });

    it("places entries relative to the directory where the archive is extracted", async () => {
      const entries = await copyTar(
        await buildTar(backupEntries),
        backupItemToContainerPath("keys", "/data/validator/keys", "/data")
      );
      expect(entries.map((e) => e.header.name)).to.deep.equal([
        "validator/keys/",
        "validator/keys/key1.json",
        "validator/keys/hardlink"
      ]);
    });

    it("places a file item at its absolute path", async () => {
      const entries = await copyTar(
        await buildTar(backupEntries),
        backupItemToContainerPath("config", "/app/config.yml", "/app")
      );
      expect(entries.map((e) => [e.header.name, e.header.uid, e.header.mode, e.content])).to.deep.equal([
        ["config.yml", 1000, 0o600, "a: 1"]
      ]);
    });

    it("rejects a base dir that does not contain the item", () => {
      expect(() => backupItemToContainerPath("keys", "/data/keys", "/other")).to.throw("is not inside");
      expect(() => backupItemToContainerPath("keys", "/data", "/data")).to.throw("is not inside");
    });
  });

  describe("writeBackupArchive and readBackupArchive", () => {
    it("writes a gzip tar with the item names as top level entries", async () => {
      const keysTar = path.join(tmpDir, "keys.tar");
      const configTar = path.join(tmpDir, "config.tar");
      fs.writeFileSync(keysTar, await buildTar(dockerArchiveEntries));
      fs.writeFileSync(
        configTar,
        await buildTar([{ header: { name: "config.yml", type: "file", mode: 0o600, uid: 1000 }, content: "a: 1" }])
      );

      const backupFile = path.join(tmpDir, "backup.tar.xz");
      await writeBackupArchive(
        [
          { name: "validator-keys", tarPath: keysTar },
          { name: "config", tarPath: configTar }
        ],
        backupFile
      );

      // gzip magic bytes, as `tar -czf` wrote
      expect(fs.readFileSync(backupFile).subarray(0, 2).toString("hex")).to.equal("1f8b");
      expect([...(await tarListTopLevelNames(readBackupArchive(backupFile)))]).to.deep.equal([
        "validator-keys",
        "config"
      ]);
      const entries = await readTar(readBackupArchive(backupFile));
      expect(entries.find((e) => e.header.name === "validator-keys/key1.json")?.header).to.include({
        uid: 1000,
        gid: 100,
        mode: 0o600
      });
      expect(entries.find((e) => e.header.name === "config")?.content).to.equal("a: 1");

      // Older dappmanagers restore by extracting the backup with tar and copying each item
      const extractDir = path.join(tmpDir, "extract");
      fs.mkdirSync(extractDir);
      execFileSync("tar", ["-xf", backupFile, "-C", extractDir]);
      expect(fs.readdirSync(extractDir).sort()).to.deep.equal(["config", "validator-keys"]);
      expect(fs.readFileSync(path.join(extractDir, "validator-keys", "key1.json"), "utf8")).to.equal("secret");
      expect(fs.readFileSync(path.join(extractDir, longName.replace("keys/", "validator-keys/")), "utf8")).to.equal(
        "long"
      );
      expect(fs.statSync(path.join(extractDir, "validator-keys", "key1.json")).mode & 0o777).to.equal(0o600);
    });

    it("reads backups created by older versions with tar -czf", async () => {
      // Layout of `docker cp` copies compressed with `tar -czf <file> -C <dir> <names...>`
      const srcDir = path.join(tmpDir, "src");
      fs.mkdirSync(path.join(srcDir, "keys"), { recursive: true });
      fs.writeFileSync(path.join(srcDir, "config"), "a: 1");
      fs.writeFileSync(path.join(srcDir, "keys", "key1.json"), "secret");
      const backupFile = path.join(tmpDir, "old_backup.tar.xz");
      execFileSync("tar", ["-czf", backupFile, "-C", srcDir, "config", "keys"], {
        env: { ...process.env, COPYFILE_DISABLE: "1" }
      });

      expect([...(await tarListTopLevelNames(readBackupArchive(backupFile)))].sort()).to.deep.equal(["config", "keys"]);

      const pack = tar.pack();
      const reading = readTar(pack);
      await tarCopyEntries(readBackupArchive(backupFile), pack, backupItemToContainerPath("keys", "/data/keys", "/"));
      pack.finalize();
      const entries = await reading;
      expect(entries.map((e) => e.header.name).sort()).to.deep.equal(["data/keys/", "data/keys/key1.json"]);
      expect(entries.find((e) => e.header.name === "data/keys/key1.json")?.content).to.equal("secret");
    });

    it("reads uncompressed tar backups", async () => {
      const backupFile = path.join(tmpDir, "plain.tar");
      fs.writeFileSync(backupFile, await buildTar([{ header: { name: "config", type: "file" }, content: "a" }]));
      expect([...(await tarListTopLevelNames(readBackupArchive(backupFile)))]).to.deep.equal(["config"]);
    });
  });
});
