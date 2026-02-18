import { MirrorProvider, MirrorListEntry, MirrorFetchResult, FetchOptions } from "./types.js";
import { normalizeCid, roundProgress } from "./utils.js";

/**
 * HTTP-based mirror provider implementation
 *
 * Fetches IPFS content from an HTTP mirror service for improved reliability and speed.
 * Falls back to IPFS when content is unavailable on the mirror.
 */
export class HttpMirrorProvider implements MirrorProvider {
  private baseUrl: string;
  private timeoutMs: number;
  private maxBytes: number;

  /**
   * Create a new HTTP mirror provider
   *
   * @param baseUrl - Base URL of the mirror service (e.g., "https://packages.dappnode.net")
   * @param timeoutMs - Timeout for requests in milliseconds
   * @param maxBytes - Maximum download size in bytes
   */
  constructor(baseUrl: string, timeoutMs: number, maxBytes: number) {
    this.baseUrl = baseUrl.replace(/\/?$/, ""); // Remove trailing slash
    this.timeoutMs = timeoutMs;
    this.maxBytes = maxBytes;
  }

  /**
   * List contents of a directory by CID
   *
   * Makes a GET request to {baseUrl}/{cid}/ and expects JSON response:
   * [
   *   {"name": "file.txt", "type": "file", "size": 123, "cid": "QmXXX", "mtime": "..."},
   *   ...
   * ]
   *
   * @param cid - Content identifier (directory CID)
   * @returns Array of entries in the directory
   * @throws Error if request fails or response is invalid
   */
  async list(cid: string): Promise<MirrorListEntry[]> {
    const normalizedCid = normalizeCid(cid);
    const url = `${this.baseUrl}/${normalizedCid}/`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Mirror list failed: ${response.status} ${response.statusText}`);
      }

      const entries = (await response.json()) as MirrorListEntry[];

      if (!Array.isArray(entries)) {
        throw new Error("Mirror list response is not an array");
      }

      return entries;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch a specific file from a directory
   *
   * Makes a GET request to {baseUrl}/{cid}/{filename}
   * Supports progress callbacks for large downloads
   *
   * @param cid - Content identifier (directory CID)
   * @param filename - Name of file to fetch
   * @param options - Optional fetch options (abort signal, progress callback)
   * @returns Result with bytes or failure reason
   */
  async fetchFile(cid: string, filename: string, options: FetchOptions = {}): Promise<MirrorFetchResult> {
    const normalizedCid = normalizeCid(cid);
    const url = `${this.baseUrl}/${normalizedCid}/${filename}`;

    return this.fetchUrl(url, options);
  }

  /**
   * Fetch content by CID directly (legacy support)
   *
   * Makes a GET request to {baseUrl}/{cid}
   * Used when we don't have a filename (older code paths)
   *
   * @param cid - Content identifier
   * @param options - Optional fetch options
   * @returns Result with bytes or failure reason
   */
  async fetchByCid(cid: string, options: FetchOptions = {}): Promise<MirrorFetchResult> {
    const normalizedCid = normalizeCid(cid);
    const url = `${this.baseUrl}/${normalizedCid}`;

    return this.fetchUrl(url, options);
  }

  /**
   * Internal method to fetch a URL with timeout and progress tracking
   *
   * @param url - URL to fetch
   * @param options - Fetch options
   * @returns Result with bytes or failure reason
   */
  private async fetchUrl(url: string, options: FetchOptions): Promise<MirrorFetchResult> {
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | undefined;

    // Use provided signal or create timeout-based abort
    const signal = options.signal || controller.signal;

    if (!options.signal) {
      timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    }

    try {
      const response = await fetch(url, {
        signal,
        headers: {
          Accept: "application/octet-stream"
        }
      });

      if (!response.ok) {
        return {
          status: "failed",
          reason: `http_error_${response.status}`
        };
      }

      // Extract hostname for observability
      const urlHost = new URL(url).hostname;

      // Get content length for progress tracking
      const contentLength = response.headers.get("content-length");
      const totalBytes = contentLength ? parseInt(contentLength, 10) : undefined;

      // Check size limit
      if (totalBytes && totalBytes > this.maxBytes) {
        return {
          status: "failed",
          reason: `file_too_large: ${totalBytes} > ${this.maxBytes}`
        };
      }

      // Read response body
      const bytes = await this.readResponseWithProgress(response, totalBytes, options.onProgress);

      // Check size limit after download
      if (bytes.length > this.maxBytes) {
        return {
          status: "failed",
          reason: `file_too_large: ${bytes.length} > ${this.maxBytes}`
        };
      }

      return {
        status: "success",
        bytes,
        urlHost
      };
    } catch (error) {
      // Check if it was aborted due to timeout
      if (error instanceof Error && error.name === "AbortError") {
        return {
          status: "failed",
          reason: "timeout"
        };
      }

      // Network error or other failure
      return {
        status: "failed",
        reason: error instanceof Error ? error.message : "unknown_error"
      };
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Read response body with progress tracking
   *
   * @param response - Fetch response
   * @param totalBytes - Total size (if known from Content-Length)
   * @param onProgress - Progress callback
   * @returns Response bytes
   */
  private async readResponseWithProgress(
    response: Response,
    totalBytes: number | undefined,
    onProgress?: (progress: number) => void
  ): Promise<Uint8Array> {
    // If no progress callback or unknown size, read directly
    if (!onProgress || !totalBytes) {
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }

    // Read with progress tracking
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const chunks: Uint8Array[] = [];
    let downloadedBytes = 0;
    let lastReportedProgress = -1;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        downloadedBytes += value.length;

        // Report progress (rounded to avoid excessive callbacks)
        const currentProgress = roundProgress(downloadedBytes, totalBytes);
        if (currentProgress !== lastReportedProgress) {
          onProgress(currentProgress);
          lastReportedProgress = currentProgress;
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Concatenate chunks into single Uint8Array
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    // Report 100% on completion
    if (onProgress && lastReportedProgress < 100) {
      onProgress(100);
    }

    return result;
  }
}
