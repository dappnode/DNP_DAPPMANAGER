import fs from "node:fs";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { CarIndexedReader, CarReader } from "@ipld/car";
import { CID } from "multiformats/cid";
import { sha256 } from "multiformats/hashes/sha2";
import { recursive as exporter } from "ipfs-unixfs-exporter";
import { IpfsGatewayClient } from "./ipfsGatewayClient.js";

const MAX_IMAGE_BYTES = 20 * 1024 ** 3;
const MAX_CAR_BYTES = 24 * 1024 ** 3;

/** CAR labels are untrusted. Authenticate each block before UnixFS reads it. */
export async function verifiedFile(
  reader: Pick<CarReader, "get" | "getRoots">,
  expected: CID
): Promise<AsyncIterable<Uint8Array>> {
  const roots = await reader.getRoots();
  if (roots.length !== 1 || !roots[0].toV1().equals(expected.toV1())) {
    throw new Error(`UNTRUSTED CONTENT: expected root ${expected}, got ${roots}`);
  }
  let content: AsyncIterable<Uint8Array> | undefined;
  for await (const entry of exporter(expected, {
    async get(cid) {
      if (cid.multihash.code !== sha256.code) throw new Error(`Unsupported IPFS block hash ${cid.multihash.code}`);
      const block = await reader.get(cid);
      if (!block) throw new Error(`Could not get block ${cid}`);
      const actual = CID.create(cid.version, cid.code, await sha256.digest(block.bytes));
      if (!actual.equals(cid)) throw new Error(`UNTRUSTED CONTENT: expected block ${cid}, got ${actual}`);
      return block.bytes;
    }
  })) {
    if (entry.type !== "file" || content) throw new Error(`Expected exactly one UnixFS file`);
    content = entry.content();
  }
  if (!content) throw new Error("Missing UnixFS file");
  return content;
}

/** Stage the CAR and output on disk. A cache hit still verifies every consumed block. */
export async function downloadVerifiedFile(
  gateways: IpfsGatewayClient,
  cid: CID,
  destination: string,
  timeoutMs = 30 * 60 * 1000,
  progress?: (n: number) => void,
  fileSize?: number
): Promise<void> {
  if (!path.isAbsolute(destination)) throw new Error(`Invalid destination path: ${destination}`);
  const directory = await fs.promises.mkdtemp(path.join(path.dirname(destination), ".verified-ipfs-"));
  const carPath = path.join(directory, "download.car");
  const outputPath = path.join(directory, "image");
  const cachePath = `${destination}.car`;
  const exportFile = async (archive: string): Promise<void> => {
    const stat = await fs.promises.stat(archive);
    if (stat.size > MAX_CAR_BYTES) throw new Error("Maximum CAR size exceeded");
    const reader = await CarIndexedReader.fromFile(archive);
    try {
      const content = await verifiedFile(reader, cid);
      await pipeline(
        Readable.from(content),
        limitBytes(MAX_IMAGE_BYTES, progress, fileSize),
        fs.createWriteStream(outputPath)
      );
    } finally {
      await reader.close();
    }
  };
  try {
    // Archive validity or a successful old download is not evidence of integrity.
    let cached = false;
    try {
      await exportFile(cachePath);
      cached = true;
    } catch {
      await fs.promises.rm(cachePath, { force: true });
    }
    if (!cached) {
      await gateways.fetch(
        `/ipfs/${cid}?format=car`,
        { headers: { Accept: "application/vnd.ipld.car" } },
        async (response) => {
          if (!response.body) throw new Error("Missing CAR response body");
          const length = Number(response.headers.get("content-length"));
          if (length > MAX_CAR_BYTES) throw new Error("Maximum CAR size exceeded");
          await pipeline(
            Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
            limitBytes(MAX_CAR_BYTES),
            fs.createWriteStream(carPath)
          );
          // Export inside the retry boundary; corrupt blocks try the next gateway.
          await exportFile(carPath);
        },
        { timeoutMs }
      );
      await fs.promises.rename(carPath, cachePath);
    }
    await fs.promises.rename(outputPath, destination);
    progress?.(100);
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
}

function limitBytes(maximum: number, progress?: (n: number) => void, expected?: number): Transform {
  let total = 0;
  let previous = -1;
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      total += chunk.length;
      if (total > maximum) return callback(new Error(`Maximum size ${maximum} bytes exceeded`));
      if (progress && expected) {
        const current = Math.min(99, Math.floor((total / expected) * 100));
        if (current !== previous) progress((previous = current));
      }
      callback(null, chunk);
    }
  });
}
