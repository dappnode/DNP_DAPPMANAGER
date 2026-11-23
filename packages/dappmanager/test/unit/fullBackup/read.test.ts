import fs from "fs";
import os from "os";
import path from "path";
import zlib from "zlib";
import { pipeline } from "stream/promises";
import tar from "tar-stream";
import { expect } from "chai";
import { createEncryptStream, EncryptOptions } from "../../../src/fullBackup/format.js";
import { extractBackup, readBackupManifest, safeArchivePath } from "../../../src/fullBackup/read.js";

const fast: EncryptOptions = { kdf: { log2N: 14, r: 8, p: 1 } };
const password = "backup password 123";
const manifest = { formatVersion: 1, createdAt: "2026-11-23T10:00:00.000Z", packages: [] };

type Entry = { name: string; data?: string; type?: "file" | "symlink" | "directory"; linkname?: string };

async function writeBackup(file: string, entries: Entry[]): Promise<void> {
  const pack = tar.pack();
  const written = pipeline(
    pack,
    zlib.createGzip(),
    await createEncryptStream(password, fast),
    fs.createWriteStream(file)
  );
  for (const { name, data = "", type = "file", linkname } of entries) {
    await new Promise<void>((resolve, reject) =>
      pack.entry({ name, type, linkname }, type === "file" ? data : undefined, (err) => (err ? reject(err) : resolve()))
    );
  }
  pack.finalize();
  await written;
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

describe("fullBackup / read", () => {
  let dir: string;
  let file: string;
  let dest: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "full-backup-read-"));
    file = path.join(dir, "backup.dnbackup");
    dest = path.join(dir, "extracted");
  });

  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("reads the manifest and extracts every file", async () => {
    await writeBackup(file, [
      { name: "backup-manifest.json", data: JSON.stringify(manifest) },
      { name: "dappmanager/maindb.json", data: "{}" },
      { name: "packages/a.dnp.dappnode.eth/backup/keys.tar", data: "KEYS" }
    ]);
    expect(await readBackupManifest(file, password)).to.deep.equal(manifest);
    expect(await extractBackup(file, password, dest)).to.deep.equal(manifest);
    expect(fs.readFileSync(path.join(dest, "packages/a.dnp.dappnode.eth/backup/keys.tar"), "utf8")).to.equal("KEYS");
  });

  it("rejects a wrong password", async () => {
    await writeBackup(file, [{ name: "backup-manifest.json", data: JSON.stringify(manifest) }]);
    await expectRejects(readBackupManifest(file, "wrong password!"), /Wrong password/);
  });

  for (const name of ["../escape", "/etc/passwd", "a/../../b", "a//b", "./a", "a\\b"]) {
    it(`refuses the unsafe entry path ${name}`, async () => {
      await writeBackup(file, [
        { name: "backup-manifest.json", data: JSON.stringify(manifest) },
        { name, data: "x" }
      ]);
      await expectRejects(extractBackup(file, password, dest), /Unsafe path/);
      expect(fs.existsSync(path.join(dir, "escape"))).to.equal(false);
    });
  }

  it("refuses symlinks", async () => {
    await writeBackup(file, [
      { name: "backup-manifest.json", data: JSON.stringify(manifest) },
      { name: "link", type: "symlink", linkname: "/etc/passwd" }
    ]);
    await expectRejects(extractBackup(file, password, dest), /Unexpected symlink/);
  });

  it("refuses an archive that does not start with the manifest", async () => {
    await writeBackup(file, [
      { name: "dappmanager/maindb.json", data: "{}" },
      { name: "backup-manifest.json", data: JSON.stringify(manifest) }
    ]);
    await expectRejects(readBackupManifest(file, password), /does not start with its manifest/);
    await expectRejects(extractBackup(file, password, dest), /does not start with its manifest/);
  });

  it("refuses duplicate entries", async () => {
    await writeBackup(file, [
      { name: "backup-manifest.json", data: JSON.stringify(manifest) },
      { name: "a", data: "1" },
      { name: "a", data: "2" }
    ]);
    await expectRejects(extractBackup(file, password, dest), /Duplicate entry|EEXIST/);
  });

  it("accepts normal nested paths", () => {
    expect(safeArchivePath("packages/x.dnp.dappnode.eth/user-settings.json")).to.equal(
      "packages/x.dnp.dappnode.eth/user-settings.json"
    );
  });
});
