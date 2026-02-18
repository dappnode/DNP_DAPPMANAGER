import { MirrorProvider, MirrorFetchResult, FetchOptions } from "./types.js";
import { normalizeCid, roundProgress } from "./utils.js";

/**
 * HTTP mirror provider for downloading package files
 */
export class HttpMirrorProvider implements MirrorProvider {
  private baseUrl: string;
  private timeoutMs: number;
  private maxBytes: number;

  constructor(baseUrl: string, timeoutMs: number, maxBytes: number) {
    this.baseUrl = baseUrl.replace(/\/?$/, "");
    this.timeoutMs = timeoutMs;
    this.maxBytes = maxBytes;
  }

  async fetchFile(cid: string, filename: string, options: FetchOptions = {}): Promise<MirrorFetchResult> {
    const normalizedCid = normalizeCid(cid);
    const url = `${this.baseUrl}/${normalizedCid}/${filename}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        return { status: "failed", reason: `http_${response.status}` };
      }

      const contentLength = response.headers.get("content-length");
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      if (totalBytes > this.maxBytes) {
        return { status: "failed", reason: "file_too_large" };
      }

      const bytes = await this.readResponseWithProgress(response, totalBytes, options.onProgress);
      return { status: "success", bytes };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error";
      return { status: "failed", reason: message };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async readResponseWithProgress(
    response: Response,
    totalBytes: number,
    onProgress?: (progress: number) => void
  ): Promise<Uint8Array> {
    if (!response.body) {
      return new Uint8Array(await response.arrayBuffer());
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;
    let lastReportedProgress = -1;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        if (onProgress && totalBytes > 0) {
          const progress = roundProgress(receivedBytes, totalBytes, 5);
          if (progress !== lastReportedProgress) {
            onProgress(progress);
            lastReportedProgress = progress;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    const result = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    if (onProgress) {
      onProgress(100);
    }

    return result;
  }
}
