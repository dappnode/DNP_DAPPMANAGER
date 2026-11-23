import fs from "fs";
import path from "path";
import zlib from "zlib";
import { pipeline } from "stream/promises";
import tar from "tar-stream";
import { FullBackupManifest } from "@dappnode/types";
import { createDecryptStream } from "./format.js";
import { MANIFEST_ARCHIVE_PATH } from "./create.js";

/** A backup without volumes is small: refuse to extract more than this */
const MAX_EXTRACTED_BYTES = 8 * 1024 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 16 * 1024 * 1024;

export class BackupArchiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupArchiveError";
  }
}

/**
 * Archive entry names must be relative paths that stay inside the
 * extraction folder. Backups are written by createFullBackup, but a restore
 * reads a file uploaded by the user, so it is treated as untrusted input
 */
export function safeArchivePath(name: string): string {
  const normalized = path.posix.normalize(name);
  if (
    !name ||
    name.includes("\0") ||
    name.includes("\\") ||
    path.posix.isAbsolute(name) ||
    normalized !== name ||
    normalized.split("/").some((segment) => segment === ".." || segment === "." || segment === "")
  ) {
    throw new BackupArchiveError(`Unsafe path in backup archive: ${JSON.stringify(name)}`);
  }
  return normalized;
}

function parseManifest(data: Buffer): FullBackupManifest {
  let manifest: FullBackupManifest;
  try {
    manifest = JSON.parse(data.toString("utf8"));
  } catch {
    throw new BackupArchiveError("Backup manifest is not valid JSON");
  }
  if (!manifest || manifest.formatVersion !== 1 || !Array.isArray(manifest.packages)) {
    throw new BackupArchiveError("Unsupported backup manifest");
  }
  return manifest;
}

/**
 * Decrypt only the start of a backup and return its manifest, which is the
 * first archive entry. Throws BackupDecryptionError on a wrong password.
 */
export async function readBackupManifest(filePath: string, password: string): Promise<FullBackupManifest> {
  const extract = tar.extract();
  let manifest: FullBackupManifest | null = null;
  let firstEntryError: Error | null = null;
  const done = new Error("manifest read");

  extract.on("entry", (header, stream, next) => {
    if (header.name !== MANIFEST_ARCHIVE_PATH || header.type !== "file" || (header.size ?? 0) > MAX_MANIFEST_BYTES) {
      firstEntryError = new BackupArchiveError("Backup does not start with its manifest");
      stream.resume();
      extract.destroy(done);
      return;
    }
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => {
      try {
        manifest = parseManifest(Buffer.concat(chunks));
      } catch (e) {
        firstEntryError = e as Error;
      }
      // Stop reading: the rest of the file is not needed for a preview
      extract.destroy(done);
      next();
    });
  });

  try {
    await pipeline(fs.createReadStream(filePath), createDecryptStream(password), zlib.createGunzip(), extract);
  } catch (e) {
    if (e !== done) throw e;
  }
  if (firstEntryError) throw firstEntryError;
  if (!manifest) throw new BackupArchiveError("Backup is empty");
  return manifest;
}

/**
 * Decrypt and extract a whole backup into `destDir`, which must not exist.
 * Every frame is authenticated while reading, so a modified or truncated
 * file fails here, before anything on the node is changed.
 */
export async function extractBackup(filePath: string, password: string, destDir: string): Promise<FullBackupManifest> {
  fs.mkdirSync(destDir, { recursive: false, mode: 0o700 });
  const extract = tar.extract();
  let extractedBytes = 0;
  let manifest: FullBackupManifest | null = null;
  const seen = new Set<string>();

  extract.on("entry", (header, stream, next) => {
    const fail = (e: Error): void => {
      stream.resume();
      extract.destroy(e);
    };
    let name: string;
    try {
      name = safeArchivePath(header.name);
    } catch (e) {
      return fail(e as Error);
    }
    if (header.type !== "file") return fail(new BackupArchiveError(`Unexpected ${header.type} entry ${name}`));
    if (seen.has(name)) return fail(new BackupArchiveError(`Duplicate entry ${name}`));
    if (seen.size === 0 && name !== MANIFEST_ARCHIVE_PATH) {
      return fail(new BackupArchiveError("Backup does not start with its manifest"));
    }
    seen.add(name);
    extractedBytes += header.size ?? 0;
    if (extractedBytes > MAX_EXTRACTED_BYTES) return fail(new BackupArchiveError("Backup content is too large"));

    const target = path.join(destDir, name);
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    const out = fs.createWriteStream(target, { mode: 0o600, flags: "wx" });
    pipeline(stream, out)
      .then(() => {
        if (name === MANIFEST_ARCHIVE_PATH) manifest = parseManifest(fs.readFileSync(target));
        next();
      })
      .catch((e) => extract.destroy(e));
  });

  await pipeline(fs.createReadStream(filePath), createDecryptStream(password), zlib.createGunzip(), extract);
  if (!manifest) throw new BackupArchiveError("Backup is empty");
  return manifest;
}

/** Read a JSON file from an extracted backup by its archive path */
export function readExtractedJson<T>(extractDir: string, archivePath: string | undefined, fallback: T): T {
  if (!archivePath) return fallback;
  const filePath = path.join(extractDir, safeArchivePath(archivePath));
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

/** Absolute path of an extracted file, or null if the archive does not contain it */
export function extractedFilePath(extractDir: string, archivePath: string | undefined): string | null {
  if (!archivePath) return null;
  const filePath = path.join(extractDir, safeArchivePath(archivePath));
  return fs.existsSync(filePath) ? filePath : null;
}
