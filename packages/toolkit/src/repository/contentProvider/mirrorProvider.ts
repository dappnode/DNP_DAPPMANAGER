import { createHash } from "crypto";
import { FetchByCidOptions, MirrorMapSource, MirrorProvider, MirrorAttemptResult } from "./types.js";
import { normalizeCid, roundProgress } from "./utils.js";

type FetchLike = typeof fetch;

export class HttpMirrorProvider implements MirrorProvider {
  private readonly mapSource: MirrorMapSource;
  private readonly timeoutMs: number;
  private readonly maxDownloadBytes: number;
  private readonly fetchFn: FetchLike;

  constructor({
    mapSource,
    timeoutMs,
    maxDownloadBytes,
    fetchFn = fetch
  }: {
    mapSource: MirrorMapSource;
    timeoutMs: number;
    maxDownloadBytes: number;
    fetchFn?: FetchLike;
  }) {
    this.mapSource = mapSource;
    this.timeoutMs = timeoutMs;
    this.maxDownloadBytes = maxDownloadBytes;
    this.fetchFn = fetchFn;
  }

  public async fetchByCid(cid: string, options?: FetchByCidOptions): Promise<MirrorAttemptResult> {
    const normalizedCid = normalizeCid(cid);
    const mapEntry = await this.mapSource.getEntry(normalizedCid);
    if (!mapEntry) return { status: "miss" };

    let url: URL;
    try {
      url = new URL(mapEntry.url);
    } catch {
      return {
        status: "failed",
        reason: "invalid mirror URL"
      };
    }

    if (url.protocol !== "https:") {
      return {
        status: "failed",
        reason: "mirror URL is not https",
        urlHost: url.host
      };
    }

    try {
      const bytes = await this.download(url, options);
      if (mapEntry.sha256) this.assertSha256(bytes, mapEntry.sha256);
      if (mapEntry.size && mapEntry.size !== bytes.length) {
        throw Error(`invalid mirror payload size: expected ${mapEntry.size}, got ${bytes.length}`);
      }

      return {
        status: "success",
        bytes,
        urlHost: url.host
      };
    } catch (e) {
      return {
        status: "failed",
        reason: sanitizeErrorMessage(e),
        urlHost: url.host
      };
    }
  }

  private async download(url: URL, options?: FetchByCidOptions): Promise<Uint8Array> {
    const timeoutMs = options?.timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.fetchFn(url.toString(), {
        method: "GET",
        signal: controller.signal
      });
      if (!response.ok) throw Error(`HTTP ${response.status}`);

      const contentLength = parseContentLength(response.headers.get("content-length"));
      if (contentLength && contentLength > this.maxDownloadBytes) {
        throw Error(`mirror payload exceeds limit ${this.maxDownloadBytes} bytes`);
      }

      const body = response.body;
      if (!body) {
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length > this.maxDownloadBytes) throw Error(`mirror payload exceeds limit ${this.maxDownloadBytes} bytes`);
        return bytes;
      }

      const reader = body.getReader();
      const chunks: Uint8Array[] = [];
      let downloadedBytes = 0;
      let previousProgress = -1;
      const expectedSize = options?.expectedSize;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;

        downloadedBytes += value.length;
        if (downloadedBytes > this.maxDownloadBytes) throw Error(`mirror payload exceeds limit ${this.maxDownloadBytes} bytes`);
        chunks.push(value);

        if (options?.progress && expectedSize) {
          const currentProgress = roundProgress(downloadedBytes, expectedSize);
          if (currentProgress !== previousProgress) {
            options.progress(currentProgress);
            previousProgress = currentProgress;
          }
        }
      }

      return joinChunks(chunks, downloadedBytes);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private assertSha256(payload: Uint8Array, expectedHex: string): void {
    const computedHex = createHash("sha256").update(payload).digest("hex");
    if (computedHex.toLowerCase() !== expectedHex.toLowerCase()) {
      throw Error("mirror checksum mismatch");
    }
  }
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

function parseContentLength(contentLengthHeader: string | null): number | undefined {
  if (!contentLengthHeader) return undefined;
  const parsed = parseInt(contentLengthHeader, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
