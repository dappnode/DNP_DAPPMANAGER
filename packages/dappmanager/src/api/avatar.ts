import { RequestHandler } from "express";
import { CID } from "multiformats/cid";
import { releaseFiles } from "@dappnode/types";

const AVATAR_CACHE_MAX_BYTES = 8 * 1024 * 1024;
const PNG_SIGNATURE = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

export type GetIpfsFileBytes = (cid: string, maxBytes: number) => Promise<Uint8Array>;

/**
 * A small process-local LRU. Browser URLs are immutable by CID, while this
 * cache prevents repeated gateway reads during the DAppManager process life.
 */
export class AvatarCache {
  private readonly entries = new Map<string, Uint8Array>();
  private readonly inFlight = new Map<string, Promise<Uint8Array>>();
  private size = 0;

  constructor(private readonly maxBytes = AVATAR_CACHE_MAX_BYTES) {}

  async get(cid: string, load: () => Promise<Uint8Array>): Promise<Uint8Array> {
    const cached = this.entries.get(cid);
    if (cached) {
      this.entries.delete(cid);
      this.entries.set(cid, cached);
      return cached;
    }

    const active = this.inFlight.get(cid);
    if (active) return active;

    const loading = load()
      .then((bytes) => {
        this.add(cid, bytes);
        return bytes;
      })
      .finally(() => this.inFlight.delete(cid));
    this.inFlight.set(cid, loading);
    return loading;
  }

  private add(cid: string, bytes: Uint8Array): void {
    if (bytes.length > this.maxBytes) return;

    while (this.size + bytes.length > this.maxBytes) {
      const oldest = this.entries.entries().next().value as [string, Uint8Array] | undefined;
      if (!oldest) break;
      this.entries.delete(oldest[0]);
      this.size -= oldest[1].length;
    }

    this.entries.set(cid, bytes);
    this.size += bytes.length;
  }
}

export function createIpfsAvatarHandler(
  getIpfsFileBytes: GetIpfsFileBytes,
  cache = new AvatarCache()
): RequestHandler<{ cid: string }> {
  return async (req, res) => {
    let cid: string;
    try {
      cid = CID.parse(req.params.cid).toString();
    } catch {
      res.status(400).send({ error: "Invalid IPFS CID" });
      return;
    }

    try {
      const bytes = await cache.get(cid, async () => {
        const loaded = await getIpfsFileBytes(cid, releaseFiles.avatar.maxSize);
        if (!hasPngSignature(loaded)) throw Error("Avatar is not a PNG file");
        return loaded;
      });
      res.set({
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "image/png",
        ETag: `"${cid}"`
      });
      res.send(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength));
    } catch {
      res.status(502).send({ error: "Avatar unavailable from configured IPFS gateways" });
    }
  };
}

function hasPngSignature(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);
}
