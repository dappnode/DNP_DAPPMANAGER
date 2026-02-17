import { CarReader } from "@ipld/car";
import { CID } from "kubo-rpc-client";
import { recursive as exporter } from "ipfs-unixfs-exporter";
import { Version } from "multiformats";
import { FetchByCidOptions, FetchByCidResult, IpfsProvider } from "./types.js";
import { normalizeCid, roundProgress } from "./utils.js";

type FetchLike = typeof fetch;

export class GatewayIpfsProvider implements IpfsProvider {
  private gatewayUrl: string;
  private readonly fetchFn: FetchLike;
  private readonly defaultTimeoutMs: number;

  constructor({
    gatewayUrl,
    defaultTimeoutMs,
    fetchFn = fetch
  }: {
    gatewayUrl: string;
    defaultTimeoutMs: number;
    fetchFn?: FetchLike;
  }) {
    this.gatewayUrl = gatewayUrl.replace(/\/?$/, "");
    this.defaultTimeoutMs = defaultTimeoutMs;
    this.fetchFn = fetchFn;
  }

  public setGatewayUrl(gatewayUrl: string): void {
    this.gatewayUrl = gatewayUrl.replace(/\/?$/, "");
  }

  public async fetchByCid(cid: string, options?: FetchByCidOptions): Promise<FetchByCidResult> {
    const normalizedCid = normalizeCid(cid);
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const carBytes = await this.downloadCar(normalizedCid, timeoutMs);
    const { carReader, root } = await this.parseAndVerifyCar(normalizedCid, carBytes);
    const fileContent = await unpackCarReader(carReader, root);

    const chunks: Uint8Array[] = [];
    let downloadedBytes = 0;
    let previousProgress = -1;
    const expectedSize = options?.expectedSize;

    for await (const chunk of fileContent) {
      chunks.push(chunk);
      downloadedBytes += chunk.length;

      if (options?.progress && expectedSize) {
        const currentProgress = roundProgress(downloadedBytes, expectedSize);
        if (currentProgress !== previousProgress) {
          options.progress(currentProgress);
          previousProgress = currentProgress;
        }
      }
    }

    return {
      provider: "ipfs",
      bytes: joinChunks(chunks, downloadedBytes)
    };
  }

  private async downloadCar(cid: string, timeoutMs: number): Promise<Uint8Array> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.gatewayUrl}/ipfs/${cid}?format=car`;
      const response = await this.fetchFn(url, {
        headers: { Accept: "application/vnd.ipld.car" },
        signal: controller.signal
      });
      if (!response.ok) throw Error(`Gateway error: ${response.status} ${response.statusText}`);
      return new Uint8Array(await response.arrayBuffer());
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async parseAndVerifyCar(
    cid: string,
    carBytes: Uint8Array
  ): Promise<{
    carReader: CarReader;
    root: CID;
  }> {
    const carReader = await CarReader.fromBytes(carBytes);
    const roots = await carReader.getRoots();
    const root = roots[0];
    const expectedRoot = CID.parse(cid).toString();
    if (roots.length !== 1 || root.toString() !== expectedRoot) {
      throw Error(`UNTRUSTED CONTENT: expected root ${expectedRoot}, got ${roots}`);
    }

    return { carReader, root };
  }
}

async function unpackCarReader(
  carReader: CarReader,
  root: CID<unknown, number, number, Version>
): Promise<AsyncIterable<Uint8Array>> {
  const fileIterables: AsyncIterable<Uint8Array>[] = [];

  const entries = exporter(root, {
    async get(cid) {
      const block = await carReader.get(cid as CID);
      if (!block) throw Error(`Could not get block ${cid}`);
      return block.bytes;
    }
  });

  for await (const entry of entries) {
    if (entry.type === "file") {
      fileIterables.push(entry.content());
    } else {
      throw Error(`Expected type: file, got: ${entry.type}`);
    }
  }

  if (fileIterables.length !== 1) {
    throw Error("Unexpected number of files. There must be only one");
  }

  return fileIterables[0];
}

function joinChunks(chunks: Uint8Array[], totalLength: number): Uint8Array {
  const out = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}
