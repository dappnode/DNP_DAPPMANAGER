import fs from "fs";
import stream from "stream";
import util from "util";
import { MirrorProvider, MirrorOptions, MirrorFileEntry, MirrorFetchResult, MirrorStreamResult, FetchOptions } from "./types.js";
import { normalizeCid, roundProgress } from "./utils.js";

const pipeline = util.promisify(stream.pipeline);

/**
 * HTTP mirror provider for downloading DAppNode package files.
 *
 * Files are served at: {baseUrl}/{packageCID}/{filename}
 * Directory listings:  {baseUrl}/{packageCID}/
 */
export class HttpMirrorProvider implements MirrorProvider {
  private baseUrl: string;
  private timeoutMs: number;
  private maxBytes: number;

  constructor({ baseUrl, timeoutMs, maxBytes }: MirrorOptions) {
    this.baseUrl = baseUrl.replace(/\/?$/, "");
    this.timeoutMs = timeoutMs;
    this.maxBytes = maxBytes;
  }

  /**
   * Build the mirror URL for a file within a package directory.
   * @param cid - Package directory CID (not an individual file CID)
   * @param filename - Filename within the package
   */
  getFileUrl(cid: string, filename: string): string {
    return `${this.baseUrl}/${normalizeCid(cid)}/${filename}`;
  }

  /**
   * List files in a package directory.
   * Mirror returns a JSON array of { name, size, ... } objects.
   * Individual file CIDs are NOT included — only the package directory CID is known.
   */
  async listFiles(cid: string): Promise<MirrorFileEntry[]> {
    const url = `${this.baseUrl}/${normalizeCid(cid)}/`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Mirror listing failed: http_${response.status}`);
      const json = (await response.json()) as Array<{ name: string; size: number }>;
      return json.map((entry) => ({ name: entry.name, size: entry.size }));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch a file into memory.
   * Use this for small files (manifests, compose, etc.) where RAM usage is not a concern.
   */
  async fetchFile(cid: string, filename: string, options: FetchOptions = {}): Promise<MirrorFetchResult> {
    const url = this.getFileUrl(cid, filename);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        return { status: "failed", reason: `http_${response.status}` };
      }

      const contentLength = response.headers.get("content-length");
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      // Check against global cap and per-call cap from Content-Length (early abort before download)
      const effectiveMax = options.maxBytes !== undefined ? Math.min(options.maxBytes, this.maxBytes) : this.maxBytes;
      if (totalBytes > effectiveMax) {
        console.debug(`Mirror file too large for ${filename}: ${totalBytes} > ${effectiveMax}`);
        return { status: "failed", reason: "file_too_large" };
      }

      const bytes = await this.readResponseWithProgress(response, totalBytes, options.onProgress);

      // Re-check with actual bytes in case Content-Length was absent or inaccurate
      if (bytes.length >= effectiveMax) {
        console.debug(`Mirror file too large for ${filename}: ${bytes.length} >= ${effectiveMax}`);
        return { status: "failed", reason: "file_too_large" };
      }

      return { status: "success", bytes };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error";
      return { status: "failed", reason: message };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Stream a file directly to disk without buffering in RAM.
   * Use this for large files (Docker images) to avoid OOM.
   */
  async fetchFileToPath(cid: string, filename: string, destPath: string, options: FetchOptions = {}): Promise<MirrorStreamResult> {
    const url = this.getFileUrl(cid, filename);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        return { status: "failed", reason: `http_${response.status}` };
      }

      if (!response.body) {
        return { status: "failed", reason: "no_response_body" };
      }

      const contentLength = response.headers.get("content-length");
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      if (totalBytes > this.maxBytes) {
        console.debug(`Mirror file too large for ${filename}: ${totalBytes} > ${this.maxBytes}`);
        return { status: "failed", reason: "file_too_large" };
      }

      const fileStream = fs.createWriteStream(destPath);
      // Convert Web ReadableStream to Node.js Readable
      const nodeReadable = stream.Readable.fromWeb(response.body as Parameters<typeof stream.Readable.fromWeb>[0]);

      if (options.onProgress && totalBytes > 0) {
        let receivedBytes = 0;
        let lastProgress = -1;
        const { onProgress } = options;

        const progressStream = new stream.Transform({
          transform(chunk: Buffer, _encoding: string, callback: () => void) {
            receivedBytes += chunk.length;
            const progress = roundProgress(receivedBytes, totalBytes, 5);
            if (progress !== lastProgress) {
              onProgress(progress);
              lastProgress = progress;
            }
            callback();
            this.push(chunk);
          }
        });

        await pipeline(nodeReadable, progressStream, fileStream);
      } else {
        await pipeline(nodeReadable, fileStream);
      }

      if (options.onProgress) options.onProgress(100);
      return { status: "success" };
    } catch (error) {
      // Clean up partial file on error
      try {
        await fs.promises.unlink(destPath);
      } catch {
        // Ignore cleanup errors
      }
      const message = error instanceof Error ? error.message : "unknown_error";
      console.debug(`Mirror stream error for ${filename}: ${message}`);
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
