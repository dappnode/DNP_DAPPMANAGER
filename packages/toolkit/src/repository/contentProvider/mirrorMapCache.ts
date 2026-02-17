import { MirrorMapCache, MirrorMapEntry, MirrorMapSchema } from "./types.js";
import { normalizeCid } from "./utils.js";

type FetchLike = typeof fetch;

type CacheState = {
  entries: Record<string, MirrorMapEntry>;
  etag?: string;
  expiresAt: number;
};

export class HttpMirrorMapCache implements MirrorMapCache {
  private readonly mapUrl?: string;
  private readonly ttlMs: number;
  private readonly timeoutMs: number;
  private readonly fetchFn: FetchLike;
  private readonly now: () => number;

  private cache?: CacheState;
  private refreshPromise?: Promise<void>;

  constructor({
    mapUrl,
    ttlMs,
    timeoutMs,
    fetchFn = fetch,
    now = Date.now
  }: {
    mapUrl?: string;
    ttlMs: number;
    timeoutMs: number;
    fetchFn?: FetchLike;
    now?: () => number;
  }) {
    this.mapUrl = mapUrl;
    this.ttlMs = ttlMs;
    this.timeoutMs = timeoutMs;
    this.fetchFn = fetchFn;
    this.now = now;
  }

  public async getEntry(cid: string): Promise<MirrorMapEntry | null> {
    await this.ensureReady();
    const normalizedCid = normalizeCid(cid);
    return this.cache?.entries[normalizedCid] ?? null;
  }

  private async ensureReady(): Promise<void> {
    if (!this.mapUrl) return;

    if (!this.cache) {
      await this.refreshSync();
      return;
    }

    if (this.now() < this.cache.expiresAt) return;
    this.refreshAsync();
  }

  /**
   * Blocking refresh used when there is no known-good map yet.
   * Any error is swallowed to preserve install flow (it will fall back to IPFS).
   */
  private async refreshSync(): Promise<void> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.refresh().finally(() => {
      this.refreshPromise = undefined;
    });

    try {
      await this.refreshPromise;
    } catch {
      // Keep undefined cache and fall back to IPFS.
    }
  }

  /**
   * Non-blocking stale-while-revalidate refresh when cache is expired.
   */
  private refreshAsync(): void {
    if (this.refreshPromise) return;
    this.refreshPromise = this.refresh()
      .catch(() => {
        // Keep last-known-good cache on refresh errors.
      })
      .finally(() => {
        this.refreshPromise = undefined;
      });
  }

  private async refresh(): Promise<void> {
    if (!this.mapUrl) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    const headers = new Headers({ Accept: "application/json" });
    if (this.cache?.etag) headers.set("If-None-Match", this.cache.etag);

    try {
      const response = await this.fetchFn(this.mapUrl, {
        headers,
        signal: controller.signal
      });

      if (response.status === 304 && this.cache) {
        this.cache.expiresAt = this.now() + this.ttlMs;
        return;
      }

      if (!response.ok) {
        throw Error(`Failed to fetch content map: HTTP ${response.status}`);
      }

      const rawMap = (await response.json()) as unknown;
      const entries = parseMirrorMap(rawMap);
      this.cache = {
        entries,
        etag: response.headers.get("etag") || undefined,
        expiresAt: this.now() + this.ttlMs
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

function parseMirrorMap(raw: unknown): Record<string, MirrorMapEntry> {
  if (!isObject(raw)) throw Error("Invalid content map JSON: expected object");

  const parsedEntries: Record<string, MirrorMapEntry> = {};
  for (const [cidKey, value] of Object.entries(raw as MirrorMapSchema)) {
    const normalizedCid = normalizeCid(cidKey);
    const parsedValue = parseMirrorMapValue(value);
    if (!normalizedCid || !parsedValue) continue;
    parsedEntries[normalizedCid] = parsedValue;
  }

  return parsedEntries;
}

function parseMirrorMapValue(value: string | MirrorMapEntry): MirrorMapEntry | null {
  if (typeof value === "string") return { url: value };
  if (!isObject(value)) return null;

  if (typeof value.url !== "string") return null;

  const entry: MirrorMapEntry = { url: value.url };
  if (typeof value.sha256 === "string" && value.sha256) entry.sha256 = value.sha256;
  if (typeof value.size === "number" && value.size > 0) entry.size = value.size;
  return entry;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
