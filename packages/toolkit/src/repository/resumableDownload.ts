import fs from "fs";
import path from "path";
import stream from "stream";
import * as dagPb from "@ipld/dag-pb";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import { BlockStore, BlockStoreError, blockStoreDir, removeStaleBlockStores } from "./blockStore.js";
import { AllGatewaysFailedError, IpfsGatewayClient } from "./ipfsGatewayClient.js";
import { ContentLog, errorMessage } from "./log.js";
import { LARGE_REQUEST, SMALL_REQUEST, TransportError, toTransportError } from "./transport.js";
import { UnixfsType, decodeUnixfsData, unixfsTypeName } from "./unixfs.js";
import {
  CAR_ACCEPT,
  RAW_ACCEPT,
  blockKey,
  blockLinks,
  exportSingleFile,
  readBoundedBytes,
  verifiedCarBlocks,
  verifyBlock
} from "./verifiedCar.js";

/**
 * A gateway that resends more than this many bytes of blocks we already hold in response to a
 * ranged CAR request is treated as not supporting ranges, and raw block requests are used instead.
 */
export const RANGE_RESEND_LIMIT_BYTES = 2 * 1024 * 1024;
const RAW_BLOCK_CONCURRENCY = 8;
/** Blocks are at most 2 MiB by convention; leave some margin. */
const MAX_BLOCK_BYTES = 4 * 1024 * 1024;
/** A CAR response may exceed the expected DAG size by this much (path blocks, CAR framing). */
const CAR_OVERHEAD_BYTES = 16 * 1024 * 1024;
/** Give up once every gateway has failed this many times without adding a single new block. */
const MAX_FAILURES_WITHOUT_PROGRESS = 2;
/** Assembly re-checks every block; retry a few times if stored blocks turn out to be missing or corrupt. */
const MAX_ASSEMBLY_ATTEMPTS = 3;

export interface ResumableDownloadArgs {
  client: IpfsGatewayClient;
  cid: string;
  destPath: string;
  /** Expected sum of block sizes (the directory link's Tsize), for progress. */
  expectedSize?: number;
  progress?: (percent: number) => void;
  log: ContentLog;
  /** Optional cap on each gateway attempt. */
  timeoutMs?: number;
}

interface MissingBlock {
  cid: CID;
  /** Byte range of the file covered by this block's subtree, when known from the parent: [start, length]. */
  range?: [number, number];
}

class MissingStoredBlockError extends Error {}

/**
 * Downloads a UnixFS file from IPFS gateways to disk, verifying every block and keeping
 * verified blocks in a block store next to the destination so that failures resume instead
 * of restarting. Memory use is bounded to a few blocks regardless of the file size.
 *
 * 1. Request the whole file as a CAR and store each verified block as it arrives.
 * 2. On failure, walk the DAG from the root using stored blocks to find missing blocks, and
 *    continue on the next gateway: first with ranged CAR requests (IPIP-402 `dag-scope=entity`
 *    and `entity-bytes=from:to`), else with one raw block request per missing block.
 * 3. Export the file from the block store to `<dest>.part` and rename it. The destination is
 *    never touched on failure.
 */
export async function downloadFileResumable(args: ResumableDownloadArgs): Promise<void> {
  const root = CID.parse(args.cid);
  if (root.multihash.code !== sha256.code) {
    throw Error(`Unsupported IPFS block hash: ${root.multihash.code}`);
  }
  const storeDir = blockStoreDir(args.destPath, root);
  try {
    for (const removed of await removeStaleBlockStores(path.dirname(args.destPath), storeDir)) {
      args.log("debug", `Removed stale IPFS block store ${removed}`);
    }
  } catch (e) {
    args.log("warn", `Could not remove stale IPFS block stores: ${errorMessage(e)}`);
  }
  const store = await BlockStore.open(storeDir);
  if (store.count > 0) args.log("debug", `Resuming ${root} from ${store.count} stored blocks`);
  await new ResumableDownload(args, root, store).run();
}

class ResumableDownload {
  private readonly rangesUnsupported = new Set<string>();
  private readonly failuresWithoutProgress = new Map<string, number>();
  private readonly lastErrors = new Map<string, TransportError>();
  private lastProgress = -1;

  constructor(
    private readonly args: ResumableDownloadArgs,
    private readonly root: CID,
    private readonly store: BlockStore
  ) {}

  async run(): Promise<void> {
    this.reportProgress();
    let assemblyAttempts = 0;
    let gateway: string | undefined;
    let moveOn = false;

    for (;;) {
      const missing = await this.findMissing();
      if (missing.length === 0) {
        try {
          await this.assemble();
        } catch (e) {
          if (e instanceof MissingStoredBlockError && ++assemblyAttempts < MAX_ASSEMBLY_ATTEMPTS) continue;
          throw e;
        }
        await this.store.destroy();
        this.args.progress?.(100);
        return;
      }

      const candidates = this.args.client
        .orderedGatewayUrls()
        .filter((url) => (this.failuresWithoutProgress.get(url) ?? 0) < MAX_FAILURES_WITHOUT_PROGRESS);
      if (candidates.length === 0) {
        throw new AllGatewaysFailedError(
          [...this.lastErrors.entries()].map(([gatewayUrl, error]) => ({ gatewayUrl, error }))
        );
      }
      // Stay on a gateway while it makes progress, otherwise continue on the next one
      if (gateway === undefined || moveOn || !candidates.includes(gateway)) {
        const index = gateway === undefined ? -1 : candidates.indexOf(gateway);
        gateway = candidates[(index + 1) % candidates.length];
      }

      const blocksBefore = this.store.count;
      let error: TransportError | undefined;
      try {
        await this.fetchMissing(gateway, missing);
      } catch (e) {
        // A local disk failure is not the gateway's fault and no other gateway can fix it
        const storeError = findBlockStoreError(e);
        if (storeError) throw storeError;
        error = toTransportError(e);
        if (error.kind === "aborted") throw error;
      }
      const progressed = this.store.count > blocksBefore;

      if (error) {
        this.lastErrors.set(gateway, error);
        this.args.log("warn", `IPFS gateway failed ${gateway}/ipfs/${this.root}: ${error.message}`);
      } else if (!progressed) {
        this.lastErrors.set(gateway, new TransportError("integrity", "response did not contain any missing block"));
      }
      if (!progressed) {
        this.failuresWithoutProgress.set(gateway, (this.failuresWithoutProgress.get(gateway) ?? 0) + 1);
      }
      moveOn = error !== undefined || !progressed;
    }
  }

  /** Walks the DAG from the root through stored blocks and returns the blocks still missing. */
  private async findMissing(): Promise<MissingBlock[]> {
    if (!this.store.has(this.root)) return [{ cid: this.root }];

    const missing: MissingBlock[] = [];
    const queue: { cid: CID; start: number; isRoot: boolean }[] = [{ cid: this.root, start: 0, isRoot: true }];
    while (queue.length > 0) {
      const { cid, start, isRoot } = queue.shift()!;
      if (cid.code !== dagPb.code || !this.store.hasLinks(cid)) continue;
      const bytes = await this.store.get(cid);
      if (!bytes) {
        missing.push({ cid });
        continue;
      }
      const node = dagPb.decode(bytes);
      const unixfs = node.Data ? decodeUnixfsData(node.Data) : undefined;
      if (isRoot && unixfs && unixfs.type !== UnixfsType.File && unixfs.type !== UnixfsType.Raw) {
        throw Error(`Expected type: file, got: ${unixfsTypeName(unixfs.type)}`);
      }

      // Child byte ranges follow from blocksizes, after any data inlined in this node
      const ranges = unixfs && unixfs.blocksizes.length === node.Links.length ? unixfs.blocksizes : undefined;
      let offset = start + (unixfs?.data?.length ?? 0);
      node.Links.forEach((link, i) => {
        const childStart = offset;
        if (ranges) offset += ranges[i];
        if (this.store.has(link.Hash)) queue.push({ cid: link.Hash, start: childStart, isRoot: false });
        else missing.push({ cid: link.Hash, range: ranges ? [childStart, ranges[i]] : undefined });
      });
    }
    return missing;
  }

  private async fetchMissing(gateway: string, missing: MissingBlock[]): Promise<void> {
    if (missing.length === 1 && missing[0].cid.equals(this.root)) {
      await this.fetchCar(gateway, `/ipfs/${this.root}?format=car`, false);
      return;
    }

    if (!this.rangesUnsupported.has(gateway) && missing.every((block) => block.range)) {
      for (const [from, to] of mergeRanges(missing.map((block) => block.range!))) {
        const query = `format=car&dag-scope=entity&entity-bytes=${from}:${to}`;
        try {
          const { rangeIgnored } = await this.fetchCar(gateway, `/ipfs/${this.root}?${query}`, true);
          if (rangeIgnored) {
            this.markRangesUnsupported(gateway, "resent blocks already held");
            break;
          }
        } catch (e) {
          const error = toTransportError(e);
          if (error.kind === "http" && (error.status === 400 || error.status === 406 || error.status === 501)) {
            this.markRangesUnsupported(gateway, error.message);
            break;
          }
          throw error;
        }
      }
      if (!this.rangesUnsupported.has(gateway)) return;
      missing = await this.findMissing();
      if (missing.length === 0) return;
    }

    await this.fetchRawBlocks(gateway, missing);
  }

  private markRangesUnsupported(gateway: string, reason: string): void {
    this.rangesUnsupported.add(gateway);
    this.args.log(
      "debug",
      `IPFS gateway ${gateway} does not support ranged CAR requests (${reason}), using raw blocks`
    );
  }

  /**
   * Streams a CAR response into the block store. For ranged requests, stops early and reports
   * the range as ignored once the gateway resends too many bytes of blocks held before the request.
   */
  private async fetchCar(gateway: string, ipfsPath: string, ranged: boolean): Promise<{ rangeIgnored: boolean }> {
    const maxResponseBytes =
      this.args.expectedSize === undefined ? undefined : this.args.expectedSize + CAR_OVERHEAD_BYTES;
    const addedByThisRequest = new Set<string>();
    return this.args.client.fetchFrom(
      gateway,
      ipfsPath,
      { headers: { Accept: CAR_ACCEPT } },
      async (response) => {
        let resentBytes = 0;
        for await (const block of verifiedCarBlocks(response, this.root, maxResponseBytes)) {
          if (await this.store.put(block.cid, block.bytes)) {
            addedByThisRequest.add(blockKey(block.cid));
            this.reportProgress();
          } else if (ranged && !addedByThisRequest.has(blockKey(block.cid))) {
            resentBytes += block.bytes.length;
            if (resentBytes > RANGE_RESEND_LIMIT_BYTES) return { rangeIgnored: true };
          }
        }
        return { rangeIgnored: false };
      },
      {
        profile: LARGE_REQUEST,
        timeoutMs: this.args.timeoutMs,
        // Repeating the same request would download the blocks just stored again. Once an attempt
        // added blocks, let the caller resume with a request for only what is still missing.
        shouldRetry: () => addedByThisRequest.size === 0
      }
    );
  }

  /**
   * Fetches missing blocks one by one, level by level, so intermediate nodes come first and
   * reveal the leaves below them.
   */
  private async fetchRawBlocks(gateway: string, missing: MissingBlock[]): Promise<void> {
    let level = missing.map((block) => block.cid);
    while (level.length > 0) {
      const next: CID[] = [];
      const seen = new Set<string>();
      await runPool(level, RAW_BLOCK_CONCURRENCY, async (cid) => {
        const bytes = await this.args.client.fetchFrom(
          gateway,
          `/ipfs/${cid}?format=raw`,
          { headers: { Accept: RAW_ACCEPT } },
          async (response) => {
            const bytes = await readBoundedBytes(response, MAX_BLOCK_BYTES);
            await verifyBlock(cid, bytes);
            return bytes;
          },
          { profile: SMALL_REQUEST, timeoutMs: this.args.timeoutMs }
        );
        await this.store.put(cid, bytes);
        this.reportProgress();
        for (const child of blockLinks(cid, bytes)) {
          const key = blockKey(child);
          if (!this.store.has(child) && !seen.has(key)) {
            seen.add(key);
            next.push(child);
          }
        }
      });
      level = next;
    }
  }

  /** Exports the file from the block store to `<dest>.part`, then renames it over the destination. */
  private async assemble(): Promise<void> {
    const partPath = `${this.args.destPath}.part`;
    let missingBlock: CID | undefined;
    try {
      const content = await exportSingleFile(this.root, async (cid) => {
        const bytes = await this.store.get(cid);
        if (!bytes) {
          missingBlock = cid;
          throw new MissingStoredBlockError(`Missing stored block ${cid}`);
        }
        return bytes;
      });
      await stream.promises.pipeline(stream.Readable.from(content), fs.createWriteStream(partPath));
      await fs.promises.rename(partPath, this.args.destPath);
    } catch (e) {
      await fs.promises.rm(partPath, { force: true });
      if (missingBlock) {
        this.args.log("warn", `Stored block ${missingBlock} is missing or corrupt, fetching it again`);
        throw new MissingStoredBlockError(errorMessage(e));
      }
      throw e;
    }
  }

  /** Reports stored bytes over the expected size, only increasing, and below 100 until done. */
  private reportProgress(): void {
    const { progress, expectedSize } = this.args;
    if (!progress || !expectedSize) return;
    const percent = Math.min(99, Math.floor((100 * this.store.bytes) / expectedSize));
    if (percent > this.lastProgress) {
      this.lastProgress = percent;
      progress(percent);
    }
  }
}

function findBlockStoreError(error: unknown): BlockStoreError | undefined {
  for (let e = error; e instanceof Error; e = e.cause) {
    if (e instanceof BlockStoreError) return e;
  }
  return undefined;
}

/** Merges [start, length] ranges into sorted inclusive [from, to] ranges. */
export function mergeRanges(ranges: [number, number][]): [number, number][] {
  const sorted = ranges.filter(([, length]) => length > 0).sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [start, length] of sorted) {
    const end = start + length - 1;
    const last = merged[merged.length - 1];
    if (last && start <= last[1] + 1) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

/** Runs task over items with at most `concurrency` in flight; stops starting new tasks after a failure. */
async function runPool<T>(items: T[], concurrency: number, task: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  let failure: unknown;
  const worker = async (): Promise<void> => {
    while (failure === undefined && next < items.length) {
      const item = items[next++];
      try {
        await task(item);
      } catch (e) {
        failure ??= e;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  if (failure !== undefined) throw failure;
}
