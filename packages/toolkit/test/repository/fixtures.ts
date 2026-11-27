import { buffer } from "node:stream/consumers";
import { CarWriter } from "@ipld/car";
import * as dagPb from "@ipld/dag-pb";
import { CID } from "multiformats/cid";
import * as raw from "multiformats/codecs/raw";
import { sha256 } from "multiformats/hashes/sha2";

export interface FixtureBlock {
  cid: CID;
  bytes: Uint8Array;
}

export interface FixtureFile {
  root: CID;
  /** Blocks in depth-first order, root first. */
  blocks: FixtureBlock[];
  /** Leaf blocks in file order. */
  leaves: FixtureBlock[];
  content: Uint8Array;
  /** Sum of all block sizes, i.e. the Tsize a directory link would carry. */
  tsize: number;
  /** Byte range [start, end) of the file covered by each block, keyed by CID string. */
  ranges: Map<string, [number, number]>;
}

function varint(value: number): number[] {
  const out: number[] = [];
  while (value >= 0x80) {
    out.push((value & 0x7f) | 0x80);
    value = Math.floor(value / 128);
  }
  out.push(value);
  return out;
}

/** Encodes a UnixFS `Data` protobuf message for a file node. */
export function unixfsFileData(filesize: number, blocksizes: number[], data?: Uint8Array): Uint8Array {
  const bytes = [8, 2]; // Type = File
  if (data) bytes.push(18, ...varint(data.length), ...data);
  bytes.push(24, ...varint(filesize));
  for (const size of blocksizes) bytes.push(32, ...varint(size));
  return Uint8Array.from(bytes);
}

async function block(bytes: Uint8Array, codec: number, version: 0 | 1): Promise<FixtureBlock> {
  const digest = await sha256.digest(bytes);
  return { cid: codec === dagPb.code && version === 0 ? CID.createV0(digest) : CID.createV1(codec, digest), bytes };
}

/**
 * Builds a UnixFS file DAG with raw leaves of `chunkSize` bytes and the given fanout,
 * so tests can exercise multi-level trees with small content.
 */
export async function unixfsFile(
  content: Uint8Array,
  { chunkSize = 4, fanout = 2, version = 1 }: { chunkSize?: number; fanout?: number; version?: 0 | 1 } = {}
): Promise<FixtureFile> {
  type Node = { block: FixtureBlock; filesize: number; tsize: number; children: Node[] };
  let level: Node[] = [];
  for (let offset = 0; offset < content.length; offset += chunkSize) {
    const bytes = content.slice(offset, offset + chunkSize);
    const leaf = await block(bytes, raw.code, 1);
    level.push({ block: leaf, filesize: bytes.length, tsize: bytes.length, children: [] });
  }
  const leaves = level.map((node) => node.block);

  while (level.length > 1 || level[0].children.length === 0) {
    const next: Node[] = [];
    for (let i = 0; i < level.length; i += fanout) {
      const children = level.slice(i, i + fanout);
      const filesize = children.reduce((sum, child) => sum + child.filesize, 0);
      const bytes = dagPb.encode(
        dagPb.prepare({
          Data: unixfsFileData(
            filesize,
            children.map((child) => child.filesize)
          ),
          Links: children.map((child) => ({ Hash: child.block.cid, Tsize: child.tsize }))
        })
      );
      const node = await block(bytes, dagPb.code, version);
      next.push({
        block: node,
        filesize,
        tsize: bytes.length + children.reduce((sum, child) => sum + child.tsize, 0),
        children
      });
    }
    level = next;
  }

  const blocks: FixtureBlock[] = [];
  const ranges = new Map<string, [number, number]>();
  const walk = (node: Node, start: number): void => {
    blocks.push(node.block);
    ranges.set(node.block.cid.toString(), [start, start + node.filesize]);
    let offset = start;
    for (const child of node.children) {
      walk(child, offset);
      offset += child.filesize;
    }
  };
  walk(level[0], 0);
  return { root: level[0].block.cid, blocks, leaves, content, tsize: level[0].tsize, ranges };
}

/** Blocks of a file whose byte range overlaps the inclusive range [from, to], in DFS order (IPIP-402 entity-bytes). */
export function blocksInRange(file: FixtureFile, from: number, to: number): FixtureBlock[] {
  return file.blocks.filter((b) => {
    const [start, end] = file.ranges.get(b.cid.toString())!;
    return start <= to && end - 1 >= from;
  });
}

export async function car(roots: CID[], blocks: FixtureBlock[]): Promise<Buffer> {
  const { writer, out } = CarWriter.create(roots);
  const result = buffer(out);
  for (const b of blocks) await writer.put(b);
  await writer.close();
  return result;
}

/** A UnixFS directory block listing the given files. */
export async function directory(entries: { name: string; cid: CID; size: number }[]): Promise<FixtureBlock> {
  const bytes = dagPb.encode(
    dagPb.prepare({
      Data: Uint8Array.from([8, 1]),
      Links: entries.map((entry) => ({ Hash: entry.cid, Name: entry.name, Tsize: entry.size }))
    })
  );
  return block(bytes, dagPb.code, 0);
}

export type Route = (request: { url: string; init?: RequestInit }) => Response | Promise<Response>;

/**
 * Replaces globalThis.fetch with a router keyed by exact URL. Unknown URLs get a 404.
 * Returns the list of requested URLs.
 */
export function mockFetch(routes: Record<string, Route>): string[] {
  const requests: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = input.toString();
    requests.push(url);
    const route = routes[url];
    if (!route) return new Response("not found", { status: 404, statusText: "Not Found" });
    return route({ url, init });
  };
  return requests;
}

export function text(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}
