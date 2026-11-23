import "mocha";
import { expect } from "chai";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import zlib from "zlib";
import { execFileSync } from "child_process";
import { once } from "events";
import { Readable } from "stream";
import tar from "tar-stream";
import { docker } from "../../src/api/docker.js";
import {
  backupItemToContainerPath,
  dockerPutBackupItem,
  readBackupArchive,
  renameTarRoot,
  tarCopyEntries,
  tarListTopLevelNames,
  writeBackupArchive
} from "../../src/backupArchive.js";

type TestEntry = {
  header: tar.Headers & { pax?: Record<string, string> };
  content?: string;
  /** pax records with values that are not UTF-8, which tar-stream cannot write from `header.pax` */
  rawPax?: Record<string, Buffer>;
};

const mtime = new Date("2024-01-02T03:04:05Z");

/** Builds a tar in memory */
async function buildTar(entries: TestEntry[]): Promise<Buffer> {
  const pack = tar.pack();
  // Large entries wait for the pack to be read
  const reading = streamToBuffer(pack);
  const addEntry = (header: tar.Headers, content: string | Buffer): Promise<void> =>
    new Promise((resolve, reject) =>
      pack.entry({ mtime, ...header }, content, (err) => (err ? reject(err) : resolve()))
    );
  for (const { header, content, rawPax } of entries) {
    if (rawPax) await addEntry({ name: "PaxHeader", type: "pax-header" }, encodeRawPax(rawPax));
    await addEntry(header, content ?? "");
  }
  pack.finalize();
  return reading;
}

/** Encodes pax records "<length> <key>=<value>\n", where length is the one of the whole record */
function encodeRawPax(records: Record<string, Buffer>): Buffer {
  return Buffer.concat(
    Object.entries(records).map(([key, value]) => {
      const record = Buffer.concat([Buffer.from(` ${key}=`), value, Buffer.from("\n")]);
      let length = record.length;
      while (length !== record.length + String(length).length) length++;
      return Buffer.concat([Buffer.from(String(length)), record]);
    })
  );
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

    it("renames the root of the archive of a path ending in /.", async () => {
      // GET /containers/{id}/archive?path=/data/keys/.
      const input = await buildTar([
        { header: { name: "./", type: "directory", mode: 0o700, uid: 1000, gid: 100 } },
        { header: { name: "./key1.json", type: "file", mode: 0o600, uid: 1000, gid: 100 }, content: "secret" },
        { header: { name: "./hardlink", type: "link", linkname: "./key1.json", uid: 1000, gid: 100 } },
        { header: { name: "./sub/", type: "directory", uid: 1000, gid: 100 } },
        { header: { name: "./sub/.hidden", type: "file", uid: 1000, gid: 100 }, content: "x" }
      ]);
      const entries = await copyTar(input, renameTarRoot("keys"));
      expect(entries.map((e) => [e.header.name, e.header.uid, e.header.mode])).to.deep.equal([
        ["keys/", 1000, 0o700],
        ["keys/key1.json", 1000, 0o600],
        ["keys/hardlink", 1000, 0o644],
        ["keys/sub/", 1000, 0o755],
        ["keys/sub/.hidden", 1000, 0o644]
      ]);
      expect(entries[2].header.linkname).to.equal("keys/key1.json");
    });

    it("renames the root of the archive of the path /", async () => {
      // GET /containers/{id}/archive?path=/
      const input = await buildTar([
        { header: { name: "/", type: "directory" } },
        { header: { name: "/etc/", type: "directory" } },
        { header: { name: "/etc/hosts", type: "file" }, content: "hosts" }
      ]);
      const entries = await copyTar(input, renameTarRoot("root"));
      expect(entries.map((e) => e.header.name)).to.deep.equal(["root/", "root/etc/", "root/etc/hosts"]);
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

    it("places only the contents of a directory item when it is extracted in its own directory", async () => {
      const entries = await copyTar(
        await buildTar(backupEntries),
        backupItemToContainerPath("keys", "/data/keys", "/data/keys")
      );
      // No entry for the existing /data/keys, which would change its owner and mode
      expect(entries.map((e) => [e.header.name, e.header.type, e.header.uid])).to.deep.equal([
        ["key1.json", "file", 1000],
        ["hardlink", "link", 1000]
      ]);
      expect(entries[1].header.linkname).to.equal("key1.json");
    });

    it("rejects a file item extracted in an existing directory", async () => {
      const pack = tar.pack();
      pack.resume();
      const error = await tarCopyEntries(
        Readable.from([await buildTar(backupEntries)]),
        pack,
        backupItemToContainerPath("config", "/app/config", "/app/config")
      ).catch((e) => e);
      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.include("config is not a directory in the backup");
    });

    it("places items whose name starts with dots", async () => {
      const entries = await copyTar(
        await buildTar(backupEntries),
        backupItemToContainerPath("config", "/data/..config", "/data")
      );
      expect(entries.map((e) => e.header.name)).to.deep.equal(["..config"]);
    });

    it("rejects a base dir that does not contain the item", () => {
      expect(() => backupItemToContainerPath("keys", "/data/keys", "/other")).to.throw("is not inside");
      expect(() => backupItemToContainerPath("keys", "/data", "/data/keys")).to.throw("is not inside");
    });
  });

  describe("tarCopyEntries with bytes that are not UTF-8", () => {
    // tar-stream reads pax records and names as UTF-8 strings
    const xattr = "SCHILY.xattr.security.capability";
    // setcap cap_net_bind_service+ep and cap_setuid+ep
    const capNetBindService = Buffer.from("0100000200040000000000000000000000000000", "hex");
    const capSetuid = Buffer.from("0100000280000000000000000000000000000000", "hex");

    it("keeps binary xattrs that are valid UTF-8 and drops the ones that are not", async () => {
      const input = await buildTar([
        { header: { name: "keys/", type: "directory" } },
        {
          header: { name: "keys/bind", type: "file", mode: 0o755 },
          content: "a",
          rawPax: { [xattr]: capNetBindService }
        },
        { header: { name: "keys/setuid", type: "file", mode: 0o755 }, content: "b", rawPax: { [xattr]: capSetuid } }
      ]);
      const entries = await copyTar(input, renameTarRoot("item"));
      expect(entries.map((e) => [e.header.name, e.content])).to.deep.equal([
        ["item/", ""],
        ["item/bind", "a"],
        ["item/setuid", "b"]
      ]);
      const paxOf = (i: number): Record<string, string> => entries[i].header.pax ?? {};
      expect(Buffer.from(paxOf(1)[xattr]).toString("hex")).to.equal(capNetBindService.toString("hex"));
      // Docker rejects the whole archive on a capability changed by the UTF-8 decoding
      expect(paxOf(2)).to.not.have.property(xattr);
    });

    it("rejects file names that are not valid UTF-8 instead of renaming them", async () => {
      const latin1Name = (name: string): TestEntry["rawPax"] => ({ path: Buffer.from(name, "latin1") });
      const input = await buildTar([
        { header: { name: "keys/", type: "directory" } },
        { header: { name: "keys/cafe.txt", type: "file" }, content: "a", rawPax: latin1Name("keys/caf\xe9.txt") },
        { header: { name: "other", type: "file" }, content: "b" }
      ]);
      const pack = tar.pack();
      pack.resume();
      const error = await tarCopyEntries(Readable.from([input]), pack, renameTarRoot("item")).catch((e) => e);
      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.include("not valid UTF-8: keys/caf");

      // Entries of other items do not prevent restoring an item
      const entries = await copyTar(input, backupItemToContainerPath("other", "/app/other", "/app"));
      expect(entries.map((e) => e.header.name)).to.deep.equal(["other"]);
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

    it("rejects backups compressed with xz, bzip2 or zstd naming the compression", () => {
      const magics = { xz: "fd377a585a0000", bzip2: "425a6839314159", zstd: "28b52ffd0458" };
      for (const [name, magic] of Object.entries(magics)) {
        const backupFile = path.join(tmpDir, `${name}_backup.tar.xz`);
        fs.writeFileSync(backupFile, Buffer.concat([Buffer.from(magic, "hex"), crypto.randomBytes(1024)]));
        expect(() => readBackupArchive(backupFile)).to.throw(`Unsupported backup compression ${name}`);
      }
    });

    it("reads uncompressed tar backups whose first entry name looks like a compression magic", async () => {
      const backupFile = path.join(tmpDir, "plain.tar");
      fs.writeFileSync(backupFile, await buildTar([{ header: { name: "BZh91AY", type: "file" }, content: "a" }]));
      expect([...(await tarListTopLevelNames(readBackupArchive(backupFile)))]).to.deep.equal(["BZh91AY"]);
    });

    it("closes the backup file when the stream is destroyed before its end", async () => {
      // Random content does not compress, so the file is larger than what the streams buffer
      const content = crypto.randomBytes(2 * 1024 * 1024).toString("hex");
      const backupFile = path.join(tmpDir, "big_backup.tar.xz");
      fs.writeFileSync(
        backupFile,
        zlib.gzipSync(await buildTar([{ header: { name: "data", type: "file" }, content }]))
      );

      const createReadStream = fs.createReadStream;
      let file: fs.ReadStream | null = null;
      fs.createReadStream = ((...args: Parameters<typeof createReadStream>) =>
        (file = createReadStream(...args))) as typeof createReadStream;
      let stream: Readable;
      try {
        stream = readBackupArchive(backupFile) as Readable;
      } finally {
        fs.createReadStream = createReadStream;
      }

      await once(stream, "data");
      // As `pipeline` does when the consumer of the tar fails
      stream.destroy();
      await once(stream, "close");
      expect(file!.destroyed).to.equal(true);
      expect(file!.readableEnded).to.equal(false);
    });
  });

  describe("dockerPutBackupItem", () => {
    // Go's os.ModeDir, as in the path stat of the docker API
    const dirMode = 0x80000000 | 0o755;
    const backupEntries: TestEntry[] = [
      { header: { name: "config", type: "file", mode: 0o600, uid: 1000, gid: 1000 }, content: "a: 1" },
      // Root owned, as in backups created by older versions
      { header: { name: "keys/", type: "directory", mode: 0o755 } },
      { header: { name: "keys/key1.json", type: "file", mode: 0o644 }, content: "secret" }
    ];

    type PutArchive = { path: string; noOverwriteDirNonDir?: boolean; names: string[] };
    let backupFile: string;
    let puts: PutArchive[];
    const getContainer = docker.getContainer;

    /** Fakes the archive API of a container with the given paths and modes */
    function fakeContainer(modes: Record<string, number>): void {
      docker.getContainer = (() => ({
        infoArchive: async ({ path: statPath }: { path: string }) => {
          if (!(statPath in modes)) throw Object.assign(Error("Could not find the file"), { statusCode: 404 });
          const stat = Buffer.from(JSON.stringify({ mode: modes[statPath] })).toString("base64");
          return { resume: () => undefined, headers: { "x-docker-container-path-stat": stat } };
        },
        putArchive: async (file: NodeJS.ReadableStream, options: Omit<PutArchive, "names">) => {
          const names = (await readTar(file)).map((e) => e.header.name);
          puts.push({ ...options, names });
        }
      })) as unknown as typeof getContainer;
    }

    beforeEach(async () => {
      puts = [];
      backupFile = path.join(tmpDir, "backup.tar.xz");
      fs.writeFileSync(backupFile, zlib.gzipSync(await buildTar(backupEntries)));
    });
    afterEach(() => {
      docker.getContainer = getContainer;
    });

    it("extracts the contents of a directory item in its existing directory", async () => {
      fakeContainer({ "/data": dirMode, "/data/keys": 0x80000000 | 0o700 });
      // "/data/keys/." is the directory "/data/keys"
      for (const itemPath of ["/data/keys", "/data/keys/.", "/data/keys/"])
        await dockerPutBackupItem("container", backupFile, { name: "keys", itemPath });
      // Without an entry for /data/keys, which keeps its owner and mode
      const put: PutArchive = { path: "/data/keys", noOverwriteDirNonDir: true, names: ["key1.json"] };
      expect(puts).to.deep.equal([put, put, put]);
    });

    it("extracts a directory item that does not exist in its closest existing parent", async () => {
      fakeContainer({ "/data": dirMode });
      await dockerPutBackupItem("container", backupFile, { name: "keys", itemPath: "/data/validator/keys/." });
      expect(puts).to.deep.equal([
        { path: "/data", noOverwriteDirNonDir: true, names: ["validator/keys/", "validator/keys/key1.json"] }
      ]);
    });

    it("extracts a file item in its directory, to replace the existing file", async () => {
      fakeContainer({ "/app": dirMode, "/app/config.yml": 0o644 });
      await dockerPutBackupItem("container", backupFile, { name: "config", itemPath: "/app/config.yml" });
      expect(puts).to.deep.equal([{ path: "/app", noOverwriteDirNonDir: true, names: ["config.yml"] }]);
    });

    it("rejects a file item whose path is an existing directory", async () => {
      fakeContainer({ "/app": dirMode, "/app/data": dirMode });
      const error = await dockerPutBackupItem("container", backupFile, { name: "config", itemPath: "/app/data" }).catch(
        (e) => e
      );
      expect(error).to.be.instanceOf(Error);
      expect(error.message).to.include("config is not a directory in the backup");
      // Nothing is written in the directory
      expect(puts.flatMap((put) => put.names)).to.deep.equal([]);
    });
  });
});
