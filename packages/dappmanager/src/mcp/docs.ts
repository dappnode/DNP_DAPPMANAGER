import { logs } from "@dappnode/logger";

/**
 * In-process cache of the official DAppNode docs (docs.dappnode.io).
 *
 * Architecture: `llms.txt` is treated as the **index** — every `(url)` link
 * pointing at docs.dappnode.io becomes an entry. The first time a search or
 * fetch is requested we parallel-fetch every page (throttled), cache it in
 * memory for 24h, then serve all subsequent calls from RAM.
 *
 * Why bother: the chat proxy exposes two tools (`dappnode_search_docs` and
 * `dappnode_fetch_doc`) so the model can read the *actual* doc prose at
 * call-time instead of relying on its training data — which may not know
 * about Dappnode-specific conventions or the latest packages.
 *
 * Memory budget: ~130 pages × ~5KB each ≈ 700KB. Negligible for dappmanager.
 */

const LLMS_TXT_URL = "https://docs.dappnode.io/llms.txt";
const INDEX_TTL_MS = 24 * 60 * 60 * 1000;
const PAGE_TTL_MS = 24 * 60 * 60 * 1000;
const PAGE_FETCH_TIMEOUT_MS = 8_000;
const INDEX_FETCH_TIMEOUT_MS = 10_000;
const CONCURRENT_FETCHES = 6;
const MAX_PAGE_BYTES = 60_000; // each
const MAX_SNIPPET_BYTES = 600;
const DOCS_ORIGIN = "https://docs.dappnode.io/";

interface DocEntry {
  url: string;
  title: string;
  description: string;
  /** Raw markdown of the page once fetched; undefined while uncached. */
  content?: string;
  /** Epoch ms of the last fetch attempt — set even on failure to avoid hammering. */
  fetchedAt?: number;
}

const docsIndex: Map<string, DocEntry> = new Map();
let indexFetchedAt = 0;
let indexInflight: Promise<void> | null = null;
let warmupPromise: Promise<void> | null = null;

/**
 * Strips Docusaurus's raw-markdown `.md` extension (and any trailing slash)
 * so what we hand back to the model matches what the user sees in their
 * browser. The `.md` is an implementation detail of the docs.dappnode.io
 * routing — humans never type it.
 *
 *   https://docs.dappnode.io/docs/dao.md     → https://docs.dappnode.io/docs/dao
 *   https://docs.dappnode.io/docs/dao.md/    → https://docs.dappnode.io/docs/dao
 *   https://docs.dappnode.io/docs/dao        → https://docs.dappnode.io/docs/dao  (idempotent)
 */
export function canonicalDocUrl(url: string): string {
  return url.replace(/\.md\/?$/i, "").replace(/\/+$/, "");
}

/** Inverse: appends `.md` so we hit the raw-markdown variant when fetching. */
function rawMarkdownUrl(canonical: string): string {
  return canonical.endsWith(".md") ? canonical : canonical + ".md";
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: ac.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parses an llms.txt body, looking for `- [title](url): description` lines
 * where the URL is under docs.dappnode.io. Preserves any previously cached
 * page content under matching URLs.
 */
function parseIndex(text: string): void {
  // `- [title](url)` optionally followed by `: description` to end of line.
  const re = /-\s*\[([^\]]+)\]\((https:\/\/docs\.dappnode\.io\/[^)]+)\)(?::\s*(.+))?$/gm;
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    // Strip `.md` so the canonical key matches the user-facing URL. We add
    // `.md` back internally when fetching the raw markdown.
    const url = canonicalDocUrl(match[2]);
    const title = match[1].trim();
    const description = (match[3] || "").trim();
    seen.add(url);
    const existing = docsIndex.get(url);
    if (existing) {
      existing.title = title;
      existing.description = description;
    } else {
      docsIndex.set(url, { url, title, description });
    }
  }
  // Drop entries that disappeared from llms.txt (keep their cache if they
  // reappear soon — but for now, prune to avoid stale results).
  for (const url of [...docsIndex.keys()]) {
    if (!seen.has(url)) docsIndex.delete(url);
  }
}

async function refreshIndex(): Promise<void> {
  if (indexInflight) return indexInflight;
  indexInflight = (async () => {
    try {
      const r = await fetchWithTimeout(LLMS_TXT_URL, INDEX_FETCH_TIMEOUT_MS);
      if (!r.ok) throw new Error(`status ${r.status}`);
      const text = await r.text();
      parseIndex(text);
      indexFetchedAt = Date.now();
      logs.info(`nexus docs: index refreshed (${docsIndex.size} entries)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logs.warn(`nexus docs: index refresh failed: ${message}`);
      // Keep stale index in place — better than nothing.
    } finally {
      indexInflight = null;
    }
  })();
  return indexInflight;
}

async function ensureIndex(): Promise<void> {
  if (docsIndex.size === 0 || Date.now() - indexFetchedAt >= INDEX_TTL_MS) {
    await refreshIndex();
  }
}

async function ensurePage(entry: DocEntry): Promise<void> {
  const now = Date.now();
  if (entry.content !== undefined && entry.fetchedAt && now - entry.fetchedAt < PAGE_TTL_MS) {
    return;
  }
  const fetchUrl = rawMarkdownUrl(entry.url);
  try {
    const r = await fetchWithTimeout(fetchUrl, PAGE_FETCH_TIMEOUT_MS);
    if (!r.ok) throw new Error(`status ${r.status}`);
    let body = await r.text();
    if (body.length > MAX_PAGE_BYTES) body = body.slice(0, MAX_PAGE_BYTES) + "\n…(truncated)";
    entry.content = body;
    entry.fetchedAt = now;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logs.warn(`nexus docs: failed to fetch ${fetchUrl}: ${message}`);
    // Mark attempted with empty body so we don't retry until the TTL expires.
    if (entry.content === undefined) entry.content = "";
    entry.fetchedAt = now;
  }
}

/** Fetches every indexed page in parallel (throttled). Memoised. */
async function warmAll(): Promise<void> {
  await ensureIndex();
  const queue = [...docsIndex.values()].filter(
    (e) => e.content === undefined || !e.fetchedAt || Date.now() - e.fetchedAt >= PAGE_TTL_MS
  );
  if (queue.length === 0) return;
  logs.info(`nexus docs: warming ${queue.length} pages…`);
  const start = Date.now();
  await Promise.all(
    Array.from({ length: CONCURRENT_FETCHES }, async () => {
      while (queue.length) {
        const entry = queue.shift();
        if (!entry) return;
        await ensurePage(entry);
      }
    })
  );
  logs.info(`nexus docs: warmed ${docsIndex.size} pages in ${Date.now() - start}ms`);
}

/** Idempotent — first call schedules warmup, subsequent calls just await it. */
export function ensureDocsWarm(): Promise<void> {
  if (!warmupPromise) {
    warmupPromise = warmAll().catch(() => {
      /* swallow — fall back to whatever we have */
    });
  }
  return warmupPromise;
}

/** Fire-and-forget kick used at startup / on first chat request. */
export function startDocsWarmup(): void {
  void ensureDocsWarm();
}

/* ────────────────────────────────────────────────────────────────────── *
 * Search
 * ────────────────────────────────────────────────────────────────────── */

export interface DocSearchHit {
  url: string;
  title: string;
  description: string;
  snippet: string;
  score: number;
}

function makeSnippet(content: string, position: number, term: string): string {
  if (!content) return "";
  const half = Math.floor(MAX_SNIPPET_BYTES / 2);
  let start = Math.max(0, position - half);
  let end = Math.min(content.length, position + half + term.length);
  // Round to word-ish boundaries so we don't slice mid-word.
  if (start > 0) {
    const nextSpace = content.indexOf(" ", start);
    if (nextSpace !== -1 && nextSpace - start < 30) start = nextSpace + 1;
  }
  if (end < content.length) {
    const prevSpace = content.lastIndexOf(" ", end);
    if (prevSpace !== -1 && end - prevSpace < 30) end = prevSpace;
  }
  const slice = content.slice(start, end).replace(/\s+/g, " ").trim();
  return (start > 0 ? "…" : "") + slice + (end < content.length ? "…" : "");
}

export async function searchDocs(query: string, limit = 5): Promise<DocSearchHit[]> {
  await ensureDocsWarm();
  const cleaned = query.trim().toLowerCase();
  if (!cleaned) return [];
  const terms = cleaned.split(/\s+/).filter((t) => t.length >= 2);
  if (terms.length === 0) return [];

  const hits: DocSearchHit[] = [];
  for (const entry of docsIndex.values()) {
    const titleLower = entry.title.toLowerCase();
    const descLower = entry.description.toLowerCase();
    const contentLower = (entry.content || "").toLowerCase();
    let score = 0;
    let firstHitIdx = -1;
    let firstHitTerm = "";
    for (const term of terms) {
      // Title matches dominate — that's where most "what is X" queries land.
      if (titleLower.includes(term)) score += 10;
      if (descLower.includes(term)) score += 4;
      const idx = contentLower.indexOf(term);
      if (idx !== -1) {
        score += 1;
        if (firstHitIdx === -1) {
          firstHitIdx = idx;
          firstHitTerm = term;
        }
      }
    }
    if (score === 0) continue;

    let snippet = entry.description;
    if (firstHitIdx !== -1 && entry.content) {
      snippet = makeSnippet(entry.content, firstHitIdx, firstHitTerm);
    }
    hits.push({
      url: entry.url,
      title: entry.title,
      description: entry.description,
      snippet,
      score
    });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, Math.max(1, limit));
}

/* ────────────────────────────────────────────────────────────────────── *
 * Direct fetch
 * ────────────────────────────────────────────────────────────────────── */

export interface DocPage {
  url: string;
  title: string;
  description: string;
  content: string;
}

export async function fetchDocPage(url: string): Promise<DocPage | null> {
  // Strict whitelist: only the official docs origin. Prevents the model
  // from being able to fetch arbitrary URLs through this tool.
  if (!url.startsWith(DOCS_ORIGIN)) return null;

  // Accept either form (with or without `.md`) — the model may receive
  // either depending on where it picked the URL up. Normalize for cache lookup.
  const canonical = canonicalDocUrl(url);

  await ensureIndex();
  let entry = docsIndex.get(canonical);
  if (!entry) {
    // Allow loading docs.dappnode.io URLs not (yet) in llms.txt — the index
    // may be stale, and the model can follow links it discovers.
    entry = { url: canonical, title: canonical.replace(DOCS_ORIGIN, "/"), description: "" };
    docsIndex.set(canonical, entry);
  }
  await ensurePage(entry);
  if (!entry.content) return null;
  return {
    url: entry.url,
    title: entry.title,
    description: entry.description,
    content: entry.content
  };
}

/** Returns the parsed index without page content — useful for diagnostics. */
export async function getDocsIndex(): Promise<Pick<DocEntry, "url" | "title" | "description">[]> {
  await ensureIndex();
  return [...docsIndex.values()].map(({ url, title, description }) => ({ url, title, description }));
}

export function getDocsStats(): { entries: number; cachedPages: number; indexAgeMs: number } {
  const cached = [...docsIndex.values()].filter((e) => e.content !== undefined && e.content.length > 0).length;
  return {
    entries: docsIndex.size,
    cachedPages: cached,
    indexAgeMs: indexFetchedAt ? Date.now() - indexFetchedAt : -1
  };
}
