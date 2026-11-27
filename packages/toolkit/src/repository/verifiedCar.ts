import { CarBlockIterator } from "@ipld/car";
import * as dagPb from "@ipld/dag-pb";
import { recursive as exporter } from "ipfs-unixfs-exporter";
import { equals } from "multiformats/bytes";
import { CID } from "multiformats/cid";
import * as raw from "multiformats/codecs/raw";
import { sha256 } from "multiformats/hashes/sha2";
import { TransportError } from "./transport.js";

export const CAR_ACCEPT = "application/vnd.ipld.car";
export const RAW_ACCEPT = "application/vnd.ipld.raw";

export interface Block {
  cid: CID;
  bytes: Uint8Array;
}

/**
 * Checks that the bytes hash to the CID's multihash. Only sha256 is supported.
 * CAR indexing only matches CID labels, so every block must be verified before it is decoded or used.
 */
export async function verifyBlock(cid: CID, bytes: Uint8Array): Promise<void> {
  if (cid.multihash.code !== sha256.code) {
    throw new TransportError("integrity", `Unsupported IPFS block hash: ${cid.multihash.code}`);
  }
  const digest = await sha256.digest(bytes);
  if (!equals(cid.multihash.bytes, digest.bytes)) {
    throw new TransportError("integrity", `IPFS block integrity check failed for ${cid}`);
  }
}

/** Key identifying a block's bytes, independent of CID version and codec. */
export function blockKey(cid: CID): string {
  return Buffer.from(cid.multihash.bytes).toString("hex");
}

/**
 * Streams the blocks of a CAR response, verifying the single root and every block's hash.
 * Holds at most a few blocks in memory regardless of the response size.
 */
export async function* verifiedCarBlocks(
  response: Response,
  expectedRoot: CID,
  maxResponseBytes?: number
): AsyncGenerator<Block> {
  const contentLength = response.headers.get("content-length");
  if (maxResponseBytes !== undefined && contentLength !== null && Number(contentLength) > maxResponseBytes) {
    throw new TransportError("too_large", `Maximum gateway response size ${maxResponseBytes} bytes exceeded`);
  }
  if (!response.body) throw new TransportError("integrity", "Empty CAR response");
  const body: ReadableStream<Uint8Array> = response.body;

  let received = 0;
  async function* chunks(): AsyncGenerator<Uint8Array> {
    for await (const chunk of streamChunks(body)) {
      received += chunk.length;
      if (maxResponseBytes !== undefined && received > maxResponseBytes) {
        throw new TransportError("too_large", `Maximum gateway response size ${maxResponseBytes} bytes exceeded`);
      }
      yield chunk;
    }
  }

  const iterator = await CarBlockIterator.fromIterable(chunks());
  const roots = await iterator.getRoots();
  if (roots.length !== 1 || !roots[0].equals(expectedRoot)) {
    throw new TransportError("integrity", `UNTRUSTED CONTENT: expected root ${expectedRoot}, got ${roots}`);
  }
  for await (const block of iterator) {
    const cid = CID.asCID(block.cid) ?? CID.decode(block.cid.bytes);
    await verifyBlock(cid, block.bytes);
    yield { cid, bytes: block.bytes };
  }
}

/** Iterates a web stream's chunks, cancelling the stream if the consumer stops early. */
export async function* streamChunks(body: ReadableStream<Uint8Array>): AsyncGenerator<Uint8Array> {
  const reader = body.getReader();
  let finished = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        finished = true;
        return;
      }
      yield value;
    }
  } finally {
    if (!finished) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/** Reads a whole response into memory, failing once it exceeds maxBytes. */
export async function readBoundedBytes(response: Response, maxBytes: number): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (response.body) {
    for await (const chunk of streamChunks(response.body)) {
      total += chunk.length;
      if (total > maxBytes) throw new TransportError("too_large", `Maximum response size ${maxBytes} bytes exceeded`);
      chunks.push(chunk);
    }
  }
  return concat(chunks, total);
}

export function concat(chunks: Uint8Array[], total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)): Uint8Array {
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

/**
 * Exports the UnixFS content under root, which must be exactly one file.
 * Blocks are read through `get`, which must return verified bytes.
 */
export async function exportSingleFile(
  root: CID,
  get: (cid: CID) => Promise<Uint8Array>
): Promise<AsyncIterable<Uint8Array>> {
  const files: AsyncIterable<Uint8Array>[] = [];
  const entries = exporter(root, { get: async (cid) => get(CID.asCID(cid) ?? CID.decode(cid.bytes)) });
  for await (const entry of entries) {
    if (entry.type === "file" || entry.type === "raw") files.push(entry.content());
    else throw Error(`Expected type: file, got: ${entry.type}`);
  }
  if (files.length !== 1) throw Error(`Unexpected number of files. There must be only one`);
  return files[0];
}

/** Links of a block, empty for raw blocks. */
export function blockLinks(cid: CID, bytes: Uint8Array): CID[] {
  if (cid.code === raw.code) return [];
  if (cid.code !== dagPb.code) throw new TransportError("integrity", `Unsupported IPFS block codec: ${cid.code}`);
  return dagPb.decode(bytes).Links.map((link) => link.Hash);
}
