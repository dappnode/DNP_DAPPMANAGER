import fs from "fs";
import path from "path";
import { CID } from "multiformats/cid";
import { errorMessage } from "./log.js";
import { blockKey, blockLinks, verifyBlock } from "./verifiedCar.js";

export const BLOCK_STORE_PREFIX = ".ipfs-blocks-";
/** Block stores left behind by downloads that never completed are removed after this age. */
export const STALE_BLOCK_STORE_MS = 24 * 60 * 60 * 1000;

// File suffixes: blocks with links (intermediate nodes) and blocks without links (leaves).
// Knowing which blocks have links lets the DAG walk skip reading leaves from disk.
const NODE_SUFFIX = ".n";
const LEAF_SUFFIX = ".b";
const TMP_SUFFIX = ".tmp";

/** A local filesystem failure of the block store (disk full, permissions). Never the gateway's fault. */
export class BlockStoreError extends Error {
  constructor(message: string, cause: unknown) {
    super(message, { cause });
    this.name = "BlockStoreError";
  }
}

/** The block store directory for a download: next to the destination, named after the root CID. */
export function blockStoreDir(destPath: string, root: CID): string {
  return path.join(path.dirname(destPath), `${BLOCK_STORE_PREFIX}${root.toString()}`);
}

/** Removes block stores in `dir` that were not touched for maxAgeMs, except `keep`. */
export async function removeStaleBlockStores(
  dir: string,
  keep: string,
  maxAgeMs = STALE_BLOCK_STORE_MS,
  now = Date.now()
): Promise<string[]> {
  const removed: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return removed;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith(BLOCK_STORE_PREFIX)) continue;
    const storePath = path.join(dir, entry.name);
    if (storePath === keep) continue;
    const stat = await fs.promises.stat(storePath).catch(() => undefined);
    if (stat && now - stat.mtimeMs > maxAgeMs) {
      await fs.promises.rm(storePath, { recursive: true, force: true });
      removed.push(storePath);
    }
  }
  return removed;
}

/**
 * A directory holding one file per verified block. It survives failures and process restarts,
 * so an interrupted download can resume, and is deleted once the file has been assembled.
 */
export class BlockStore {
  private readonly index = new Map<string, { size: number; hasLinks: boolean }>();
  private totalBytes = 0;

  private constructor(readonly dir: string) {}

  static async open(dir: string): Promise<BlockStore> {
    await fs.promises.mkdir(dir, { recursive: true });
    // Mark the store as in use so stale store cleanup leaves it alone
    const now = new Date();
    await fs.promises.utimes(dir, now, now);

    const store = new BlockStore(dir);
    for (const name of await fs.promises.readdir(dir)) {
      const file = path.join(dir, name);
      if (name.endsWith(TMP_SUFFIX)) {
        // Left behind by an interrupted write
        await fs.promises.rm(file, { force: true });
        continue;
      }
      const hasLinks = name.endsWith(NODE_SUFFIX);
      if (!hasLinks && !name.endsWith(LEAF_SUFFIX)) continue;
      const stat = await fs.promises.stat(file);
      store.index.set(name.slice(0, -NODE_SUFFIX.length), { size: stat.size, hasLinks });
      store.totalBytes += stat.size;
    }
    return store;
  }

  /** Sum of the sizes of all stored blocks. */
  get bytes(): number {
    return this.totalBytes;
  }

  get count(): number {
    return this.index.size;
  }

  has(cid: CID): boolean {
    return this.index.has(blockKey(cid));
  }

  /** Whether a stored block has links to other blocks. */
  hasLinks(cid: CID): boolean {
    return this.index.get(blockKey(cid))?.hasLinks ?? false;
  }

  /**
   * Reads a block and verifies it again, since the store may come from an earlier run.
   * A block that fails verification is deleted and reported as missing.
   */
  async get(cid: CID): Promise<Uint8Array | undefined> {
    const key = blockKey(cid);
    const entry = this.index.get(key);
    if (!entry) return undefined;
    let bytes: Uint8Array;
    try {
      bytes = await fs.promises.readFile(this.file(key, entry.hasLinks));
      await verifyBlock(cid, bytes);
    } catch {
      await this.delete(cid);
      return undefined;
    }
    return bytes;
  }

  /** Stores a verified block. Returns false if it was already stored. */
  async put(cid: CID, bytes: Uint8Array): Promise<boolean> {
    const key = blockKey(cid);
    if (this.index.has(key)) return false;
    const hasLinks = blockLinks(cid, bytes).length > 0;
    const file = this.file(key, hasLinks);
    // Write then rename, so a crash never leaves a truncated block under its final name
    try {
      await fs.promises.writeFile(file + TMP_SUFFIX, bytes);
      await fs.promises.rename(file + TMP_SUFFIX, file);
    } catch (e) {
      await fs.promises.rm(file + TMP_SUFFIX, { force: true }).catch(() => undefined);
      throw new BlockStoreError(`Could not store IPFS block in ${this.dir}: ${errorMessage(e)}`, e);
    }
    this.index.set(key, { size: bytes.length, hasLinks });
    this.totalBytes += bytes.length;
    return true;
  }

  async delete(cid: CID): Promise<void> {
    const key = blockKey(cid);
    const entry = this.index.get(key);
    if (!entry) return;
    this.index.delete(key);
    this.totalBytes -= entry.size;
    await fs.promises.rm(this.file(key, entry.hasLinks), { force: true });
  }

  async destroy(): Promise<void> {
    this.index.clear();
    this.totalBytes = 0;
    await fs.promises.rm(this.dir, { recursive: true, force: true });
  }

  private file(key: string, hasLinks: boolean): string {
    return path.join(this.dir, key + (hasLinks ? NODE_SUFFIX : LEAF_SUFFIX));
  }
}
