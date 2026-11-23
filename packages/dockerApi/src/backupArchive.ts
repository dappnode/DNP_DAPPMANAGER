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

/** Returns the new path of a tar entry of the given `type`, or null to drop it */
export type TarPathMapper = (entryPath: string, type?: tar.Headers["type"]) => string | null;

// Largest values tar-stream writes in the ustar octal fields, larger ones go in pax records
const USTAR_MAX_SIZE = 0o77777777777;
const USTAR_MAX_ID = 0o777777;
const PAX_XATTR = "SCHILY.xattr.";
const LINUX_XATTR_NAMESPACES = ["security.", "system.", "trusted.", "user."];
// tar-stream reads names and pax records as UTF-8 strings and writes them back
// as UTF-8, so every other byte is lost as this replacement character
const NOT_UTF8 = "\uFFFD";
// Go's os.ModeDir, the directory bit of the `mode` of the docker API path stat
const GO_MODE_DIR = 0x80000000;
// Compressions `tar -xf` detected in backups re-packed by hand. Backups are
// always written as gzip, despite their .tar.xz extension
const UNSUPPORTED_COMPRESSIONS = [
  { name: "xz", magic: [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00] },
  { name: "bzip2", magic: [0x42, 0x5a, 0x68] },
  { name: "zstd", magic: [0x28, 0xb5, 0x2f, 0xfd] }
];

/**
 * Copies the entries of the tar `input` into `pack`, renaming them with
 * `mapPath`. Every other header field (uid, gid, mode, mtime, type, xattrs in
 * pax records...) is kept as is, except xattrs Linux cannot set or whose
 * value is not valid UTF-8. Rejects on file names that are not valid UTF-8.
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
  const name = mapPath(header.name, header.type);
  if (name === null) return null;

  // Fail instead of renaming the file, or the one a link points to
  for (const original of [header.name, header.linkname])
    if (original?.includes(NOT_UTF8)) throw Error(`Unsupported file name, it is not valid UTF-8: ${original}`);

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
  // com.apple.* ones of archives made on macOS, or a binary value that is not
  // valid UTF-8 and so not the original one, such as some file capabilities
  for (const [key, value] of Object.entries(pax)) {
    if (!key.startsWith(PAX_XATTR)) continue;
    const isLinuxXattr = LINUX_XATTR_NAMESPACES.some((ns) => key.startsWith(PAX_XATTR + ns));
    if (!isLinuxXattr || key.includes(NOT_UTF8) || value.includes(NOT_UTF8)) delete pax[key];
  }
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
 * Renames the single top level entry of an archive from the docker API and
 * everything under it to `newRoot`. That entry is `basename(path)`, "." for a
 * path ending in "/." ("./", "./key1.json") or empty for "/" ("/", "/etc/")
 */
export function renameTarRoot(newRoot: string): TarPathMapper {
  let root: string | null = null;
  return (entryPath) => {
    const i = entryPath.indexOf("/");
    const top = i < 0 ? entryPath : entryPath.slice(0, i);
    if (root === null) root = top;
    else if (top !== root) throw Error(`Unexpected entry ${entryPath} outside of ${root}`);
    return newRoot + entryPath.slice(top.length);
  };
}

/**
 * Picks the entries of the backup item `name` and places them at the absolute
 * container path `itemPath`, relative to the directory `baseDir` where the
 * archive is extracted. Entries for `baseDir` and its parents are never
 * emitted so their owner and mode are not changed.
 *
 * `baseDir` can be `itemPath` itself, to place the contents of a directory
 * item in an existing directory as `docker cp <dir>/. <container>:<itemPath>`
 */
export function backupItemToContainerPath(name: string, itemPath: string, baseDir: string): TarPathMapper {
  const target = path.posix.relative(baseDir, itemPath);
  if (target === ".." || target.startsWith("../")) throw Error(`Path ${itemPath} is not inside ${baseDir}`);
  return (entryPath, type) => {
    const [top, rest] = splitTopLevel(entryPath);
    if (top !== name) return null;
    if (target) return target + rest;
    // "/key1.json" -> "key1.json"
    if (rest.length > 1) return rest.slice(1);
    if (type === "directory") return null;
    throw Error(`${name} is not a directory in the backup, it cannot be restored to the directory ${itemPath}`);
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

/**
 * Reads a backup file, a gzip tar (or a plain tar), as a tar stream.
 * Throws if it is compressed with xz, bzip2 or zstd.
 */
export function readBackupArchive(filePath: string): NodeJS.ReadableStream {
  // Up to the "ustar" magic of the first tar header
  const head = Buffer.alloc(262);
  const fd = fs.openSync(filePath, "r");
  try {
    fs.readSync(fd, head, 0, head.length, 0);
  } finally {
    fs.closeSync(fd);
  }
  // A plain tar starts with the name of its first entry, which can be anything
  const isTar = head.toString("latin1", 257) === "ustar";
  const compression = UNSUPPORTED_COMPRESSIONS.find(({ magic }) => magic.every((byte, i) => head[i] === byte));
  if (compression && !isTar)
    throw Error(`Unsupported backup compression ${compression.name}: the backup file must be a gzip compressed tar`);

  const file = fs.createReadStream(filePath);
  if (head[0] === 0x1f && head[1] === 0x8b) {
    const gunzip = zlib.createGunzip();
    file.on("error", (e) => gunzip.destroy(e));
    // pipe() does not close the file when gunzip is destroyed before its end
    gunzip.on("close", () => file.destroy());
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
 *
 * If `itemPath` is an existing directory the contents of the item are
 * extracted in it, so it keeps its owner and mode too, as `docker cp` did.
 * Fails instead of replacing a directory with a file or a file with a directory.
 */
export async function dockerPutBackupItem(
  containerName: string,
  backupPath: string,
  { name, itemPath }: { name: string; itemPath: string }
): Promise<void> {
  // "/data/keys/." and "/data/keys/" are the directory "/data/keys"
  itemPath = path.posix.resolve("/", itemPath);
  const baseDir = (await isContainerDir(containerName, itemPath))
    ? itemPath
    : await getClosestExistingDir(containerName, path.posix.dirname(itemPath));
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
    dockerPutArchive(containerName, baseDir, pack, { noOverwriteDirNonDir: true }).catch(fail)
  ]);
  if (firstError) throw firstError;
}

async function isContainerDir(containerName: string, dirPath: string): Promise<boolean> {
  try {
    const { mode } = await dockerInfoArchive(containerName, dirPath);
    return (Number(mode) & GO_MODE_DIR) !== 0;
  } catch (e) {
    if (e.statusCode !== 404) throw e;
    return false;
  }
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
