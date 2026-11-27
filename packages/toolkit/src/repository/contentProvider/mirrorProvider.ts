import fs from "fs";
import stream from "stream";
import {
  MirrorProvider,
  MirrorOptions,
  MirrorFileEntry,
  MirrorFetchResult,
  MirrorStreamResult,
  FetchOptions
} from "./types.js";
import { normalizeCid, roundProgress } from "./utils.js";
import { ContentLog, errorMessage, noopLog } from "../log.js";
import {
  LARGE_REQUEST,
  RequestProfile,
  SMALL_REQUEST,
  TransportError,
  TransportPolicy,
  toTransportError
} from "../transport.js";

/**
 * HTTP mirror provider for downloading DAppNode package files.
 *
 * Files are served at: {baseUrl}/{packageCID}/{filename}
 * Directory listings:  {baseUrl}/{packageCID}/
 *
 * Requests follow the shared transport policy (timeouts, retries, per-host concurrency).
 */
export class HttpMirrorProvider implements MirrorProvider {
  private baseUrl: string;
  private maxBytes: number;
  private readonly headersTimeoutMs?: number;
  private readonly log: ContentLog;
  private readonly policy: TransportPolicy;

  constructor(
    { baseUrl, timeoutMs, maxBytes }: MirrorOptions,
    log: ContentLog = noopLog,
    policy: TransportPolicy = new TransportPolicy()
  ) {
    this.baseUrl = baseUrl.replace(/\/?$/, "");
    this.headersTimeoutMs = timeoutMs;
    this.maxBytes = maxBytes;
    this.log = log;
    this.policy = policy;
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
   * @throws TransportError if the request fails or the listing is malformed.
   */
  async listFiles(cid: string, options: Pick<FetchOptions, "signal"> = {}): Promise<MirrorFileEntry[]> {
    const url = `${this.baseUrl}/${normalizeCid(cid)}/`;
    return this.request(url, SMALL_REQUEST, options.signal, async (response) => {
      let json: unknown;
      try {
        json = await response.json();
      } catch (e) {
        if (e instanceof TransportError) throw e;
        throw new TransportError("integrity", `Invalid mirror listing: ${errorMessage(e)}`);
      }
      return parseMirrorListing(json);
    });
  }

  /**
   * Fetch a file into memory.
   * Use this for small files (manifests, compose, etc.) where RAM usage is not a concern.
   */
  async fetchFile(cid: string, filename: string, options: FetchOptions = {}): Promise<MirrorFetchResult> {
    const url = this.getFileUrl(cid, filename);
    // Check against global cap and per-call cap
    const effectiveMax = options.maxBytes !== undefined ? Math.min(options.maxBytes, this.maxBytes) : this.maxBytes;
    const progress = monotonicProgress(options.onProgress);

    try {
      const bytes = await this.request(url, SMALL_REQUEST, options.signal, async (response) => {
        const totalBytes = contentLengthOf(response);
        // Early abort before download when Content-Length is known
        if (totalBytes > effectiveMax) {
          throw new TransportError("too_large", `file_too_large (${totalBytes} > ${effectiveMax})`);
        }
        return readResponse(response, effectiveMax, (received) => progress(roundProgress(received, totalBytes, 5)));
      });
      progress(100);
      return { status: "success", bytes };
    } catch (e) {
      return this.fail(url, e);
    }
  }

  /**
   * Stream a file directly to disk without buffering in RAM.
   * Use this for large files (Docker images) to avoid OOM. The file is written to
   * `<destPath>.part` and renamed on success, so the destination is never left half-written.
   */
  async fetchFileToPath(
    cid: string,
    filename: string,
    destPath: string,
    options: FetchOptions = {}
  ): Promise<MirrorStreamResult> {
    const url = this.getFileUrl(cid, filename);
    const partPath = `${destPath}.part`;
    const progress = monotonicProgress(options.onProgress);

    try {
      await this.request(url, LARGE_REQUEST, options.signal, async (response) => {
        if (!response.body) throw new TransportError("integrity", "no_response_body");

        const totalBytes = contentLengthOf(response);
        if (totalBytes > this.maxBytes) {
          throw new TransportError("too_large", `file_too_large (${totalBytes} > ${this.maxBytes})`);
        }

        let receivedBytes = 0;
        const maxBytes = this.maxBytes;
        const counter = new stream.Transform({
          transform(chunk: Buffer, _encoding, callback) {
            receivedBytes += chunk.length;
            if (receivedBytes > maxBytes) {
              callback(new TransportError("too_large", `file_too_large (${receivedBytes} > ${maxBytes})`));
              return;
            }
            if (totalBytes > 0) progress(roundProgress(receivedBytes, totalBytes, 5));
            callback(null, chunk);
          }
        });

        // Convert Web ReadableStream to Node.js Readable
        const nodeReadable = stream.Readable.fromWeb(response.body as Parameters<typeof stream.Readable.fromWeb>[0]);
        await stream.promises.pipeline(nodeReadable, counter, fs.createWriteStream(partPath));
      });
      await fs.promises.rename(partPath, destPath);
      progress(100);
      return { status: "success" };
    } catch (error) {
      // Clean up partial file on error
      await fs.promises.unlink(partPath).catch(() => undefined);
      return this.fail(url, error);
    }
  }

  private request<T>(
    url: string,
    profile: RequestProfile,
    signal: AbortSignal | undefined,
    consume: (response: Response) => Promise<T>
  ): Promise<T> {
    return this.policy.request({
      endpoint: this.baseUrl,
      url,
      init: signal ? { signal } : {},
      consume,
      profile: this.headersTimeoutMs === undefined ? profile : { ...profile, headersTimeoutMs: this.headersTimeoutMs },
      hooks: {
        onAttempt: (attempt) => this.log("debug", `Trying mirror ${url}${attempt > 1 ? ` (attempt ${attempt})` : ""}`),
        onRetry: (error, delayMs) =>
          this.log("warn", `Mirror request failed ${url}: ${error.message}; retrying in ${delayMs} ms`)
      }
    });
  }

  private fail(url: string, error: unknown): { status: "failed"; reason: string } {
    const reason = toTransportError(error).message;
    this.log("warn", `Mirror download failed ${url}: ${reason}`);
    return { status: "failed", reason };
  }
}

function contentLengthOf(response: Response): number {
  const contentLength = response.headers.get("content-length");
  const parsed = contentLength ? parseInt(contentLength, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** Reads a response body into memory, failing as soon as it exceeds maxBytes. */
async function readResponse(
  response: Response,
  maxBytes: number,
  onBytes: (receivedBytes: number) => void
): Promise<Uint8Array> {
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > maxBytes)
      throw new TransportError("too_large", `file_too_large (${bytes.length} > ${maxBytes})`);
    return bytes;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.length;
      if (receivedBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new TransportError("too_large", `file_too_large (${receivedBytes} > ${maxBytes})`);
      }
      chunks.push(value);
      onBytes(receivedBytes);
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
  return result;
}

/** Wraps a progress callback so it only reports increasing values, also across retries. */
function monotonicProgress(onProgress?: (progress: number) => void): (progress: number) => void {
  let last = -1;
  return (progress) => {
    if (!onProgress || progress <= last) return;
    last = progress;
    onProgress(progress);
  };
}

/**
 * Validates the mirror directory listing. Anything other than an array of
 * `{ name: string, size: number }` is treated as a mirror failure.
 */
export function parseMirrorListing(json: unknown): MirrorFileEntry[] {
  if (!Array.isArray(json)) throw new TransportError("integrity", "Invalid mirror listing: expected an array");
  return json.map((entry, index) => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof entry.name !== "string" ||
      entry.name === "" ||
      typeof entry.size !== "number" ||
      !Number.isFinite(entry.size) ||
      entry.size < 0
    ) {
      throw new TransportError("integrity", `Invalid mirror listing entry at index ${index}`);
    }
    return { name: entry.name, size: entry.size };
  });
}
