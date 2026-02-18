import { FetchByCidOptions, MirrorProvider, MirrorAttemptResult, MirrorListEntry } from "./types.js";
import { normalizeCid, roundProgress } from "./utils.js";

type FetchLike = typeof fetch;

export class HttpMirrorProvider implements MirrorProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxDownloadBytes: number;
  private readonly fetchFn: FetchLike;

  constructor({
    baseUrl,
    timeoutMs,
    maxDownloadBytes,
    fetchFn = fetch
  }: {
    baseUrl: string;
    timeoutMs: number;
    maxDownloadBytes: number;
    fetchFn?: FetchLike;
  }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeoutMs = timeoutMs;
    this.maxDownloadBytes = maxDownloadBytes;
    this.fetchFn = fetchFn;
  }

  /**
   * List files in a directory by fetching JSON from mirror
   */
  public async list(cid: string): Promise<MirrorListEntry[]> {
    const normalizedCid = normalizeCid(cid);
    const url = `${this.baseUrl}/${normalizedCid}/`;

    try {
      const response = await this.fetchFn(url, {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      if (!response.ok) throw Error(`HTTP ${response.status}`);

      const entries: MirrorListEntry[] = await response.json();
      return entries;
    } catch (e) {
      throw new Error(`Failed to list mirror directory: ${sanitizeErrorMessage(e)}`);
    }
  }

  /**
   * Download a specific file from a directory
   */
  public async fetchFile(cid: string, filename: string, options?: FetchByCidOptions): Promise<MirrorAttemptResult> {
    const normalizedCid = normalizeCid(cid);
    const url = `${this.baseUrl}/${normalizedCid}/${filename}`;

    try {
      const bytes = await this.download(url, options);
      return {
        status: "success",
        bytes,
        url
      };
    } catch (e) {
      return {
        status: "failed",
        reason: sanitizeErrorMessage(e),
        url
      };
    }
  }

  public async fetchByCid(cid: string, options?: FetchByCidOptions): Promise<MirrorAttemptResult> {
    const normalizedCid = normalizeCid(cid);
    const url = `${this.baseUrl}/${normalizedCid}/`;

    try {
      const bytes = await this.download(url, options);
      return {
        status: "success",
        bytes,
        url
      };
    } catch (e) {
      return {
        status: "failed",
        reason: sanitizeErrorMessage(e),
        url
      };
    }
  }

  private async download(url: string, options?: FetchByCidOptions): Promise<Uint8Array> {
    const timeoutMs = options?.timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.fetchFn(url, {
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
