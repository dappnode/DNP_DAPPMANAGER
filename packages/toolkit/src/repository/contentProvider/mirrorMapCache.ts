import { MirrorMapEntry, MirrorMapSchema, MirrorMapSource } from "./types.js";
import { normalizeCid } from "./utils.js";

type FetchLike = typeof fetch;

export class HttpMirrorMapSource implements MirrorMapSource {
  private readonly mapUrl?: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: FetchLike;

  constructor({
    mapUrl,
    timeoutMs,
    fetchFn = fetch
  }: {
    mapUrl?: string;
    timeoutMs: number;
    fetchFn?: FetchLike;
  }) {
    this.mapUrl = mapUrl;
    this.timeoutMs = timeoutMs;
    this.fetchFn = fetchFn;
  }

  public async getEntry(cid: string): Promise<MirrorMapEntry | null> {
    try {
      if (!this.mapUrl) return null;
      const entries = await this.fetchMap();
      return entries[normalizeCid(cid)] ?? null;
    } catch {
      // Never block install flow on mirror map issues.
      return null;
    }
  }

  private async fetchMap(): Promise<Record<string, MirrorMapEntry>> {
    if (!this.mapUrl) return {};
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(this.mapUrl, {
        headers: { Accept: "application/json" },
        signal: controller.signal
      });

      if (!response.ok) {
        throw Error(`Failed to fetch content map: HTTP ${response.status}`);
      }

      const rawMap = (await response.json()) as unknown;
      return parseMirrorMap(rawMap);
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
