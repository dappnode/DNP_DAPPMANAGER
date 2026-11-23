import fs from "fs";
import path from "path";
import zlib from "zlib";
import tar from "tar-stream";
import { pipeline } from "stream/promises";
import { dockerGetArchive, dockerInfoArchive, dockerPutArchive } from "./api/index.js";

/**
 * Package backups (the Backup tab of a package) are a gzip tar whose top
 * level entries are the backup item names:
 *
 * ```
 * config          <- item { name: "config", path: "/app/config.yml" }
 * keys/           <- item { name: "keys", path: "/data/keys" }
 * keys/key1.json
 * ```
 *
 * They are built from and restored with the docker archive API, which keeps
 * the uid, gid and mode of every file in the tar headers and works on stopped
 * containers and on images without a shell. Backups created by older versions
 * with `docker cp` + `tar -czf` have the same layout, so both restore the same way.
 */

/** tar-stream parses pax records into `header.pax`, missing from its types */
type TarHeaders = tar.Headers & { pax?: Record<string, string> };

/** Returns the new path of a tar entry, or null to drop it */
export type TarPathMapper = (entryPath: string) => string | null;

// Largest values tar-stream writes in the ustar octal fields, larger ones go in pax records
const USTAR_MAX_SIZE = 0o77777777777;
const USTAR_MAX_ID = 0o777777;
const PAX_XATTR = "SCHILY.xattr.";
const LINUX_XATTR_NAMESPACES = ["security.", "system.", "trusted.", "user."];

/**
 * Copies the entries of the tar `input` into `pack`, renaming them with
 * `mapPath`. Every other header field (uid, gid, mode, mtime, type, xattrs in
 * pax records...) is kept as is, except xattrs Linux cannot set.
 * Resolves with the number of entries copied.
 */
export async function tarCopyEntries(
  input: NodeJS.ReadableStream,
  pack: tar.Pack,
  mapPath: TarPathMapper
): Promise<number> {
  let count = 0;
  const extract = tar.extract();

  extract.on("entry", (header: TarHeaders, stream, next) => {
    let mapped: TarHeaders | null;
    try {
      mapped = mapTarHeader(header, mapPath);
    } catch (e) {
      stream.resume();
      return next(e);
    }

    if (!mapped) {
      stream.on("end", () => next());
      stream.resume();
      return;
    }

    const sink = pack.entry(mapped, (err) => {
      if (err) return next(err);
      count++;
      next();
    });
    // pack.entry returns nothing once the pack is destroyed
    if (!sink) {
      stream.resume();
      return next(Error("tar pack closed"));
    }
    stream.pipe(sink);
  });

  await pipeline(input, extract);
  return count;
}

function mapTarHeader(header: TarHeaders, mapPath: TarPathMapper): TarHeaders | null {
  const name = mapPath(header.name);
  if (name === null) return null;

  const mapped: TarHeaders = { ...header, name };
  if (header.type === "link" && header.linkname) {
    // Hard links point to another entry of the same archive
    const linkname = mapPath(header.linkname);
    if (linkname === null) throw Error(`Hard link ${header.name} points outside the item: ${header.linkname}`);
    mapped.linkname = linkname;
  }

  // tar-stream writes path and linkpath records from name and linkname, stale
  // copies of the original ones would override the new names
  const pax = { ...header.pax };
  delete pax.path;
  delete pax.linkpath;
  // Docker fails the whole upload on xattrs Linux cannot set, such as the
  // com.apple.* ones of archives made on macOS
  for (const key of Object.keys(pax))
    if (key.startsWith(PAX_XATTR) && !LINUX_XATTR_NAMESPACES.some((ns) => key.startsWith(PAX_XATTR + ns)))
      delete pax[key];
  if ((header.size ?? 0) > USTAR_MAX_SIZE) pax.size = String(header.size);
  if ((header.uid ?? 0) > USTAR_MAX_ID) pax.uid = String(header.uid);
  if ((header.gid ?? 0) > USTAR_MAX_ID) pax.gid = String(header.gid);
  mapped.pax = Object.keys(pax).length > 0 ? pax : undefined;

  return mapped;
}

/** Splits "keys/a/b" into ["keys", "/a/b"], ignoring leading "./" and "/" */
function splitTopLevel(entryPath: string): [string, string] {
  const normalized = entryPath.replace(/^(\.?\/)+/, "");
  const i = normalized.indexOf("/");
  return i < 0 ? [normalized, ""] : [normalized.slice(0, i), normalized.slice(i)];
}

/**
 * Renames the single top level entry of an archive from the docker API, which
 * is `basename(path)`, and everything under it to `newRoot`
 */
export function renameTarRoot(newRoot: string): TarPathMapper {
  let root: string | null = null;
  return (entryPath) => {
    const [top, rest] = splitTopLevel(entryPath);
    if (root === null) root = top;
    else if (top !== root) throw Error(`Unexpected entry ${entryPath} outside of ${root}`);
    return newRoot + rest;
  };
}

/**
 * Picks the entries of the backup item `name` and places them at the absolute
 * container path `itemPath`, relative to the directory `baseDir` where the
 * archive is extracted. Entries for `baseDir` and its parents are never
 * emitted so their owner and mode are not changed.
 */
export function backupItemToContainerPath(name: string, itemPath: string, baseDir: string): TarPathMapper {
  const target = path.posix.relative(baseDir, itemPath);
  if (!target || target.startsWith("..")) throw Error(`Path ${itemPath} is not inside ${baseDir}`);
  return (entryPath) => {
    const [top, rest] = splitTopLevel(entryPath);
    return top === name ? target + rest : null;
  };
}

/** Lists the top level entry names of a tar */
export async function tarListTopLevelNames(input: NodeJS.ReadableStream): Promise<Set<string>> {
  const names = new Set<string>();
  const extract = tar.extract();
  extract.on("entry", (header: TarHeaders, stream, next) => {
    const [top] = splitTopLevel(header.name);
    if (top) names.add(top);
    stream.on("end", () => next());
    stream.resume();
  });
  await pipeline(input, extract);
  return names;
}

/** Reads a backup file, a gzip tar (or a plain tar), as a tar stream */
export function readBackupArchive(filePath: string): NodeJS.ReadableStream {
  const magic = Buffer.alloc(2);
  const fd = fs.openSync(filePath, "r");
  try {
    fs.readSync(fd, magic, 0, 2, 0);
  } finally {
    fs.closeSync(fd);
  }
  const file = fs.createReadStream(filePath);
  if (magic[0] === 0x1f && magic[1] === 0x8b) {
    const gunzip = zlib.createGunzip();
    file.on("error", (e) => gunzip.destroy(e));
    return file.pipe(gunzip);
  }
  return file;
}

/**
 * Writes the backup file `outPath`, a gzip tar with each item's archive
 * from the docker API (`tarPath`) renamed to its item name
 */
export async function writeBackupArchive(items: { name: string; tarPath: string }[], outPath: string): Promise<void> {
  const pack = tar.pack();
  const writing = pipeline(pack, zlib.createGzip(), fs.createWriteStream(outPath));
  try {
    for (const { name, tarPath } of items) {
      await tarCopyEntries(fs.createReadStream(tarPath), pack, renameTarRoot(name));
    }
    pack.finalize();
  } catch (e) {
    pack.destroy(e);
    await writing.catch(() => undefined);
    throw e;
  }
  await writing;
}

/**
 * Downloads `itemPath` of a container to `tarPath` as a tar from the docker
 * API, with uid, gid and mode in its headers. Works on stopped containers.
 */
export async function dockerGetBackupItem(containerName: string, itemPath: string, tarPath: string): Promise<void> {
  const archive = await dockerGetArchive(containerName, itemPath);
  await pipeline(archive, fs.createWriteStream(tarPath));
}

/**
 * Restores the item `name` of the backup file `backupPath` to `itemPath` of a
 * container with the docker API, keeping the uid, gid and mode of the backup.
 * Does not need a shell in the container nor the container to be running.
 *
 * The archive is extracted in the closest existing parent of `itemPath`, so
 * existing parents keep their owner and mode, Docker creates the missing ones
 * (owned by root, as `mkdir -p` did) and containers with a read-only root
 * filesystem can be restored when the item is in a volume.
 */
export async function dockerPutBackupItem(
  containerName: string,
  backupPath: string,
  { name, itemPath }: { name: string; itemPath: string }
): Promise<void> {
  const baseDir = await getClosestExistingDir(containerName, path.posix.dirname(itemPath));
  const pack = tar.pack();

  // Stop both sides on the first error: destroying the pack aborts the upload
  // to docker and the copy of entries into it
  let firstError: unknown = null;
  const fail = (e: unknown): void => {
    firstError ??= e;
    pack.destroy(e as Error);
  };
  const mapPath = backupItemToContainerPath(name, itemPath, baseDir);
  await Promise.all([
    tarCopyEntries(readBackupArchive(backupPath), pack, mapPath)
      .then(() => pack.finalize())
      .catch(fail),
    dockerPutArchive(containerName, baseDir, pack).catch(fail)
  ]);
  if (firstError) throw firstError;
}

async function getClosestExistingDir(containerName: string, dir: string): Promise<string> {
  while (dir !== "/") {
    try {
      await dockerInfoArchive(containerName, dir);
      return dir;
    } catch (e) {
      if (e.statusCode !== 404) throw e;
      dir = path.posix.dirname(dir);
    }
  }
  return dir;
}
