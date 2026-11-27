import { expect } from "chai";
import { randomBytes } from "node:crypto";
import fs, { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JsonRpcProvider } from "ethers";
import { DappnodeRepository } from "../../src/repository/repository.js";
import { RANGE_RESEND_LIMIT_BYTES, mergeRanges } from "../../src/repository/resumableDownload.js";
import { decodeUnixfsData } from "../../src/repository/unixfs.js";
import { FixtureBlock, FixtureFile, blocksInRange, car, unixfsFile, unixfsFileData } from "./fixtures.js";

const A = "https://a.example";
const B = "https://b.example";
const CHUNK = 256 * 1024;

type Behaviour =
  | { kind: "ranges" }
  | { kind: "ignoreRanges"; rateLimitFirstRawRequests?: number }
  | { kind: "truncate"; afterBlocks: number }
  | { kind: "drop"; afterBlocks: number }
  | { kind: "corrupt"; blockIndex: number }
  | { kind: "fail" };

interface Served {
  url: string;
  blocks: string[];
}

function repository(): DappnodeRepository {
  return new DappnodeRepository(
    [A, B],
    new JsonRpcProvider(),
    { baseUrl: "https://mirror.example", maxBytes: 1024 },
    () => false,
    undefined,
    { sleep: async () => undefined }
  );
}

/** CAR of all blocks, cut a few bytes into block `afterBlocks`, as if the connection dropped. */
async function truncatedCar(file: FixtureFile, afterBlocks: number): Promise<Buffer> {
  const full = await car([file.root], file.blocks);
  const prefix = await car([file.root], file.blocks.slice(0, afterBlocks));
  return full.subarray(0, prefix.length + 5);
}

function corrupt(block: FixtureBlock): FixtureBlock {
  const bytes = Uint8Array.from(block.bytes);
  bytes[bytes.length - 1] ^= 1;
  return { cid: block.cid, bytes };
}

/** Simulates trustless gateways with the given behaviours, recording every request and the blocks served. */
function mockGateways(file: FixtureFile, behaviours: Record<string, Behaviour>): Served[] {
  const served: Served[] = [];
  const byCid = new Map(file.blocks.map((b) => [b.cid.toString(), b]));
  let rawRequests = 0;
  globalThis.fetch = async (input) => {
    const url = new URL(input.toString());
    const record: Served = { url: input.toString(), blocks: [] };
    served.push(record);
    const behaviour = behaviours[url.origin];
    const cid = url.pathname.replace(/^\/ipfs\//, "");
    const format = url.searchParams.get("format");
    const respond = async (blocks: FixtureBlock[]): Promise<Response> => {
      record.blocks = blocks.map((b) => b.cid.toString());
      return new Response(await car([file.root], blocks));
    };

    if (behaviour.kind === "fail") return new Response("down", { status: 500, statusText: "Internal Server Error" });

    if (format === "raw") {
      // A gateway that drops connections serves no single blocks either
      if (behaviour.kind === "truncate") return new Response("not found", { status: 404 });
      if (behaviour.kind === "ignoreRanges" && rawRequests++ < (behaviour.rateLimitFirstRawRequests ?? 0)) {
        return new Response("slow down", { status: 429, statusText: "Too Many Requests" });
      }
      const block = byCid.get(cid);
      if (!block) return new Response("not found", { status: 404 });
      record.blocks = [cid];
      return new Response(Buffer.from(block.bytes));
    }

    if (format !== "car" || cid !== file.root.toString()) return new Response("not found", { status: 404 });
    switch (behaviour.kind) {
      case "truncate":
        record.blocks = file.blocks.slice(0, behaviour.afterBlocks).map((b) => b.cid.toString());
        return new Response(await truncatedCar(file, behaviour.afterBlocks));
      case "drop": {
        // The connection resets mid-body, which surfaces as a network error rather than a short CAR
        if (url.searchParams.get("entity-bytes")) return new Response("down", { status: 500 });
        record.blocks = file.blocks.slice(0, behaviour.afterBlocks).map((b) => b.cid.toString());
        const bytes = await truncatedCar(file, behaviour.afterBlocks);
        let sent = false;
        return new Response(
          new ReadableStream<Uint8Array>({
            pull(controller) {
              if (sent) return controller.error(new TypeError("terminated"));
              sent = true;
              controller.enqueue(bytes);
            }
          })
        );
      }
      case "corrupt":
        return respond(file.blocks.map((b, i) => (i === behaviour.blockIndex ? corrupt(b) : b)));
      case "ignoreRanges":
        return respond(file.blocks);
      case "ranges": {
        const entityBytes = url.searchParams.get("entity-bytes");
        if (!entityBytes) return respond(file.blocks);
        expect(url.searchParams.get("dag-scope")).to.equal("entity");
        const [from, to] = entityBytes.split(":");
        return respond(blocksInRange(file, Number(from), to === "*" ? file.content.length - 1 : Number(to)));
      }
    }
  };
  return served;
}

function servedBy(served: Served[], origin: string): Served[] {
  return served.filter((s) => new URL(s.url).origin === origin);
}

function leafCids(file: FixtureFile): Set<string> {
  return new Set(file.leaves.map((leaf) => leaf.cid.toString()));
}

describe("Resumable verified image download", function () {
  this.timeout(20_000);
  const originalFetch = globalThis.fetch;
  let dir: string;
  let file: FixtureFile;

  before(async () => {
    // 24 leaves of 256 KiB in a three-level tree
    file = await unixfsFile(randomBytes(24 * CHUNK), { chunkSize: CHUNK, fanout: 4, version: 0 });
  });

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "resumable-download-"));
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    await rm(dir, { recursive: true, force: true });
  });

  async function download(progress?: (n: number) => void): Promise<string> {
    const path = join(dir, "image.txz");
    await repository().writeFileToFs({ hash: file.root.toString(), path, fileSize: file.tsize, progress });
    return path;
  }

  it("resumes a stream truncated mid-file on a second gateway without refetching held blocks", async () => {
    const served = mockGateways(file, { [A]: { kind: "truncate", afterBlocks: 9 }, [B]: { kind: "ranges" } });

    const path = await download();

    expect(Buffer.compare(await readFile(path), Buffer.from(file.content))).to.equal(0);
    const fromA = servedBy(served, A);
    const fromB = servedBy(served, B);
    expect(fromA).to.have.length(1);
    expect(fromB.length).to.be.greaterThan(0);
    expect(fromB.every((s) => s.url.includes("dag-scope=entity&entity-bytes="))).to.equal(true);
    // Only path blocks (root and intermediate nodes) may be resent, never leaves already held
    const heldLeaves = fromA[0].blocks.filter((cid) => leafCids(file).has(cid));
    expect(heldLeaves.length).to.be.greaterThan(0);
    for (const s of fromB) for (const cid of heldLeaves) expect(s.blocks).to.not.include(cid);
    // The block store is removed after success
    expect((await readdir(dir)).filter((name) => name.startsWith(".ipfs-blocks-"))).to.deep.equal([]);
  });

  it("does not request the whole file again from a gateway whose connection dropped mid-file", async () => {
    const served = mockGateways(file, { [A]: { kind: "drop", afterBlocks: 9 }, [B]: { kind: "ranges" } });

    const path = await download();

    expect(Buffer.compare(await readFile(path), Buffer.from(file.content))).to.equal(0);
    const wholeFileRequests = servedBy(served, A).filter((s) => !s.url.includes("entity-bytes="));
    expect(wholeFileRequests).to.have.length(1);
    expect(servedBy(served, B).every((s) => s.url.includes("entity-bytes="))).to.equal(true);
  });

  it("fails at once on a local disk error instead of blaming the gateways", async () => {
    const served = mockGateways(file, { [A]: { kind: "ranges" }, [B]: { kind: "ranges" } });
    const originalWriteFile = fs.promises.writeFile;
    fs.promises.writeFile = (async () => {
      throw Object.assign(new Error("ENOSPC: no space left on device"), { code: "ENOSPC" });
    }) as typeof fs.promises.writeFile;

    let error: Error | undefined;
    try {
      await download();
    } catch (e) {
      error = e as Error;
    } finally {
      fs.promises.writeFile = originalWriteFile;
    }

    expect(error?.message).to.include("ENOSPC");
    expect(error?.message).to.not.include("All IPFS gateways failed");
    expect(served).to.have.length(1);
    expect(existsSync(join(dir, "image.txz"))).to.equal(false);
  });

  it("discards a corrupt block and fetches it from another gateway", async () => {
    const corruptIndex = file.blocks.findIndex((b) => b.cid.equals(file.leaves[10].cid));
    const served = mockGateways(file, { [A]: { kind: "corrupt", blockIndex: corruptIndex }, [B]: { kind: "ranges" } });

    const path = await download();

    expect(Buffer.compare(await readFile(path), Buffer.from(file.content))).to.equal(0);
    const fromB = servedBy(served, B);
    expect(fromB.some((s) => s.blocks.includes(file.leaves[10].cid.toString()))).to.equal(true);
    // Blocks before the corrupt one were kept
    for (const s of fromB) expect(s.blocks).to.not.include(file.leaves[0].cid.toString());
  });

  it("falls back to raw block requests when a gateway ignores the range", async () => {
    // Hold more than the resend limit before switching gateway
    const afterBlocks = file.blocks.findIndex((b) => b.cid.equals(file.leaves[14].cid));
    expect(14 * CHUNK).to.be.greaterThan(RANGE_RESEND_LIMIT_BYTES);
    const served = mockGateways(file, { [A]: { kind: "truncate", afterBlocks }, [B]: { kind: "ignoreRanges" } });

    const path = await download();

    expect(Buffer.compare(await readFile(path), Buffer.from(file.content))).to.equal(0);
    const fromB = servedBy(served, B);
    expect(fromB[0].url).to.include("entity-bytes=");
    const raw = fromB.filter((s) => s.url.endsWith("?format=raw"));
    expect(raw.length).to.be.greaterThan(0);
    // Raw requests only ask for blocks that were missing
    const held = new Set(file.blocks.slice(0, afterBlocks).map((b) => b.cid.toString()));
    for (const s of raw) expect(held.has(s.blocks[0])).to.equal(false);
    // Only one ranged request was made before switching to raw blocks
    expect(fromB.filter((s) => s.url.includes("entity-bytes="))).to.have.length(1);
  });

  it("slows down and waits instead of giving up when a gateway rate limits raw block requests", async () => {
    const afterBlocks = file.blocks.findIndex((b) => b.cid.equals(file.leaves[14].cid));
    const served = mockGateways(file, {
      [A]: { kind: "truncate", afterBlocks },
      [B]: { kind: "ignoreRanges", rateLimitFirstRawRequests: 20 }
    });
    const sleeps: number[] = [];
    const repo = new DappnodeRepository(
      [A, B],
      new JsonRpcProvider(),
      { baseUrl: "https://mirror.example", maxBytes: 1024 },
      () => false,
      undefined,
      { sleep: async (ms) => void sleeps.push(ms) }
    );
    const path = join(dir, "image.txz");

    await repo.writeFileToFs({ hash: file.root.toString(), path, fileSize: file.tsize });

    expect(Buffer.compare(await readFile(path), Buffer.from(file.content))).to.equal(0);
    // The rate-limited gateway was paused for seconds, not hammered again after a sub-second retry
    expect(sleeps.some((ms) => ms >= 1000)).to.equal(true);
    expect(servedBy(served, B).filter((s) => s.url.endsWith("?format=raw")).length).to.be.greaterThan(20);
  });

  it("reuses the block store left by a previous failed run", async () => {
    const afterBlocks = 8;
    mockGateways(file, {
      [A]: { kind: "truncate", afterBlocks },
      [B]: { kind: "truncate", afterBlocks }
    });
    let error: unknown;
    try {
      await download();
    } catch (e) {
      error = e;
    }
    expect((error as Error).message).to.match(/^All IPFS gateways failed \(/);
    expect((await readdir(dir)).filter((name) => name.startsWith(".ipfs-blocks-"))).to.have.length(1);

    // A new process: fresh repository, healthy gateway
    const served = mockGateways(file, { [A]: { kind: "ranges" }, [B]: { kind: "ranges" } });
    const path = await download();

    expect(Buffer.compare(await readFile(path), Buffer.from(file.content))).to.equal(0);
    expect(served[0].url).to.include("entity-bytes=");
    const held = file.blocks.slice(0, afterBlocks).map((b) => b.cid.toString());
    for (const s of served)
      for (const cid of held.filter((c) => leafCids(file).has(c))) expect(s.blocks).to.not.include(cid);
    expect((await readdir(dir)).filter((name) => name.startsWith(".ipfs-blocks-"))).to.deep.equal([]);
  });

  it("leaves the destination untouched when every gateway fails", async () => {
    mockGateways(file, { [A]: { kind: "fail" }, [B]: { kind: "fail" } });
    const path = join(dir, "image.txz");
    await writeFile(path, "previous download");

    let error: unknown;
    try {
      await repository().writeFileToFs({ hash: file.root.toString(), path, fileSize: file.tsize });
    } catch (e) {
      error = e;
    }

    expect((error as Error).message).to.equal(
      `All IPFS gateways failed (${A}: 500 Internal Server Error; ${B}: 500 Internal Server Error)`
    );
    expect(await readFile(path, "utf8")).to.equal("previous download");
    expect(existsSync(`${path}.part`)).to.equal(false);
  });

  it("reports monotonic progress that ends at 100", async () => {
    mockGateways(file, { [A]: { kind: "truncate", afterBlocks: 12 }, [B]: { kind: "ranges" } });
    const progress: number[] = [];

    await download((n) => progress.push(n));

    expect(progress[progress.length - 1]).to.equal(100);
    for (let i = 1; i < progress.length; i++) expect(progress[i]).to.be.greaterThan(progress[i - 1]);
    expect(progress.some((n) => n > 0 && n < 100)).to.equal(true);
  });

  it("removes block stores older than a day", async () => {
    mockGateways(file, { [A]: { kind: "ranges" }, [B]: { kind: "ranges" } });
    const stale = join(dir, ".ipfs-blocks-stale");
    const recent = join(dir, ".ipfs-blocks-recent");
    await mkdir(stale);
    await mkdir(recent);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await utimes(stale, twoDaysAgo, twoDaysAgo);

    await download();

    expect(existsSync(stale)).to.equal(false);
    expect(existsSync(recent)).to.equal(true);
  });
});

describe("UnixFS helpers", () => {
  it("decodes file data with blocksizes", () => {
    const data = decodeUnixfsData(unixfsFileData(300, [100, 200]));
    expect(data).to.deep.equal({ type: 2, filesize: 300, blocksizes: [100, 200] });
  });

  it("merges adjacent and overlapping ranges into inclusive ranges", () => {
    expect(
      mergeRanges([
        [10, 5],
        [0, 5],
        [5, 5],
        [30, 10],
        [35, 10]
      ])
    ).to.deep.equal([
      [0, 14],
      [30, 44]
    ]);
  });
});
