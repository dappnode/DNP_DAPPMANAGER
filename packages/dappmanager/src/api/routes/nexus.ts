import type { Request, Response as ExpressResponse } from "express";
import * as db from "@dappnode/db";
import { listPackages } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import type { InstalledPackageData, PackageContainer } from "@dappnode/types";
import { wrapHandler } from "../utils.js";
import { dappnodeTools, dappnodeToolList } from "../../mcp/tools.js";
import { dispatchTool, getOpenAITools } from "../../mcp/dispatch.js";
import { createPendingConfirmation, resolveConfirmation } from "../../mcp/confirmation.js";
import { startDocsWarmup } from "../../mcp/docs.js";

/**
 * Nexus chat proxy — talks to a Nexus gateway with a Nexus API key held
 * server-side, so the secret never reaches the browser.
 *
 * The DAppNode admin configures a single Nexus API key from the admin UI.
 * The key is stored in dbMain and never reaches the browser.
 */

const DEFAULT_GATEWAY_URL = "https://nexus-api.dappnode.com/v1";
const DEFAULT_MODEL = "nexus/auto";
const LLMS_TXT_URL = "https://docs.dappnode.io/llms.txt";
const LLMS_TXT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LLMS_TXT_MAX_BYTES = 60_000; // safety cap; all listed gateway models have ≥128K context
const PACKAGE_LIST_TTL_MS = 60_000; // 60 seconds — listPackages() hits Docker

function getGatewayUrl(): string {
  const raw = process.env.NEXUS_GATEWAY_URL || DEFAULT_GATEWAY_URL;
  return raw.replace(/\/+$/, "");
}

/**
 * The effective Nexus API key. Stored in dbMain so the user can configure it
 * in-app without restarting the container.
 */
function getApiKey(): string {
  return db.nexusApiKey.get();
}

/** Where the effective key comes from — surfaced to the UI. */
function getApiKeySource(): "db" | "none" {
  if (db.nexusApiKey.get()) return "db";
  return "none";
}

function getDefaultModel(): string {
  return process.env.NEXUS_DEFAULT_MODEL || DEFAULT_MODEL;
}

interface NexusStatus {
  configured: boolean;
  gatewayUrl: string;
  defaultModel: string;
  /** Where the active key comes from: set in-app or unset. */
  keySource: "db" | "none";
}

/* ──────────────────────────────────────────────────────────────────── *
 * Dappnode context — injected as a system message on every chat call.
 * ──────────────────────────────────────────────────────────────────── */

let llmsCache: { fetchedAt: number; content: string } | null = null;
let llmsInflight: Promise<string> | null = null;

/**
 * Strips Docusaurus's raw-markdown `.md` extension from any docs.dappnode.io
 * URL inside an llms.txt body, so the catalogue the model sees uses the same
 * URLs a human would visit. The raw `.md` form is purely an implementation
 * detail for the docs-fetch tool.
 */
function stripMdFromDocsUrls(body: string): string {
  return body.replace(/(https:\/\/docs\.dappnode\.io\/[^\s)]+?)\.md(?=[\s)])/g, "$1");
}

/** Fetches docs.dappnode.io/llms.txt with a 24h in-memory cache. */
async function fetchLlmsContext(): Promise<string> {
  const now = Date.now();
  if (llmsCache && now - llmsCache.fetchedAt < LLMS_TXT_TTL_MS) {
    return llmsCache.content;
  }
  if (llmsInflight) return llmsInflight;

  llmsInflight = (async () => {
    try {
      const r = await fetch(LLMS_TXT_URL);
      if (!r.ok) throw new Error(`status ${r.status}`);
      const raw = await r.text();
      const stripped = stripMdFromDocsUrls(raw);
      const trimmed =
        stripped.length > LLMS_TXT_MAX_BYTES ? stripped.slice(0, LLMS_TXT_MAX_BYTES) + "\n\n…(truncated)…" : stripped;
      llmsCache = { fetchedAt: now, content: trimmed };
      return trimmed;
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      logs.warn(`nexus: failed to fetch llms.txt: ${message}`);
      // Keep a stale cache if we had one; otherwise return empty.
      return llmsCache?.content ?? "";
    } finally {
      llmsInflight = null;
    }
  })();
  return llmsInflight;
}

let packageListCache: { fetchedAt: number; content: string } | null = null;

function summarizeContainerState(containers: PackageContainer[]): string {
  if (!containers.length) return "no-containers";
  const states = containers.map((c) => c.state).filter(Boolean);
  if (states.length === 0) return "unknown";
  if (states.every((s) => s === "running")) return "running";
  // Show one entry per distinct state to keep it terse.
  return Array.from(new Set(states)).join("/");
}

/** Builds a compact list of installed packages (60s in-memory cache). */
async function describeInstalledPackages(): Promise<string> {
  const now = Date.now();
  if (packageListCache && now - packageListCache.fetchedAt < PACKAGE_LIST_TTL_MS) {
    return packageListCache.content;
  }

  let pkgs: InstalledPackageData[];
  try {
    pkgs = await listPackages();
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    logs.warn(`nexus: listPackages failed: ${message}`);
    return "(unable to read the installed-package list right now)";
  }

  if (pkgs.length === 0) {
    packageListCache = { fetchedAt: now, content: "(no packages installed)" };
    return packageListCache.content;
  }

  // Non-core first, then alphabetical within each group.
  const sorted = [...pkgs].sort((a, b) => {
    if (a.isCore !== b.isCore) return a.isCore ? 1 : -1;
    return a.dnpName.localeCompare(b.dnpName);
  });

  const lines = sorted.map((p) => {
    const state = summarizeContainerState(p.containers || []);
    const tags: string[] = [];
    if (p.isCore) tags.push("core");
    if (p.chain) tags.push(`chain:${p.chain}`);
    const tagStr = tags.length ? ` [${tags.join(", ")}]` : "";
    const version = p.version ? `v${p.version}` : "v?";
    return `- ${p.dnpName} (${version}, ${state})${tagStr}`;
  });

  const content = lines.join("\n");
  packageListCache = { fetchedAt: now, content };
  return content;
}

/**
 * Per-request page context — the admin UI passes the route the user is
 * currently looking at when they hit Send. Used so vague references
 * ("what is this", "explain this page") have an answer without an extra
 * round-trip. Optional — chat works fine without it.
 */
interface DappmanagerPageContext {
  path?: unknown;
  search?: unknown;
  hash?: unknown;
  title?: unknown;
}

function describePageContext(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const ctx = raw as DappmanagerPageContext;
  const path = typeof ctx.path === "string" ? ctx.path : "";
  if (!path) return null;
  const search = typeof ctx.search === "string" ? ctx.search : "";
  const hash = typeof ctx.hash === "string" ? ctx.hash : "";
  const title = typeof ctx.title === "string" ? ctx.title.trim() : "";

  const fullPath = path + search + hash;
  const lines: string[] = ["================ USER'S CURRENT PAGE (admin UI) ================", `- Path: ${fullPath}`];
  if (title) lines.push(`- Title: ${title}`);
  lines.push(
    'When the user asks vague things like "what is this" or "how do I use this page", assume they mean the page above. Otherwise treat it as ambient context — don\'t volunteer it unless relevant.',
    "================ END USER'S CURRENT PAGE ================",
    ""
  );
  return lines.join("\n");
}

/** Builds the full system prompt sent on every chat request. */
async function buildSystemPrompt(pageContext?: unknown): Promise<string> {
  // Kick off the docs cache warmup in the background — first chat of the
  // session triggers it, subsequent calls await the same promise. By the
  // time the model decides to call dappnode_search_docs, pages are cached.
  startDocsWarmup();

  const [docsIndex, packageList] = await Promise.all([fetchLlmsContext(), describeInstalledPackages()]);

  const today = new Date().toISOString().slice(0, 10);
  const parts: string[] = [
    `You are an AI assistant embedded inside a user's Dappnode — a personal, sovereign node for Web3 infrastructure (staking, validators, dApps, AI inference).`,
    `Today is ${today}.`,
    "",
    "## How to answer",
    "",
    "**The official docs at docs.dappnode.io are the source of truth.** For ANY question about DAppNode — concepts, packages, configuration, troubleshooting, staking, networking, VPN access, validators, Smooth, the DAO, hardware, installation — you MUST consult the docs via tools, NOT your training data. Training-data knowledge of DAppNode is often outdated or wrong; the docs are not.",
    "",
    "Workflow for any DAppNode-specific question:",
    "1. Call `dappnode_search_docs(query)` with the user's keywords.",
    "2. Read the returned snippets. If they answer the question, summarize them and cite the page URL.",
    "3. If a snippet isn't enough, call `dappnode_fetch_doc(url)` to read the full page.",
    "4. Only AFTER consulting the docs do you answer. If the docs don't cover it, say so explicitly.",
    "",
    'For questions about THIS Dappnode\'s runtime state ("is X running", "what\'s eating my disk"), use the runtime tools (`dappnode_list_packages`, `dappnode_get_package_logs`, `dappnode_diagnose`, etc.) instead of guessing from the package snapshot below.',
    "",
    "Be concise and direct. Use markdown (lists, headings, fenced code blocks) when it helps. When referring to a specific installed package, use its exact `dnpName`. When citing docs, link the URL.",
    "",
    "**Docs URL rule:** When you cite a docs.dappnode.io URL to the user, NEVER include a trailing `.md`. The `.md` form (e.g. `…/wireguard.md`) is the raw-markdown variant used internally by the docs-fetch tool — humans visit the same URL without `.md` (e.g. `…/wireguard`). If a doc page's content links to another page using a `.md` URL, drop the `.md` before showing it to the user.",
    "",
    "**Local URL rule:** When giving the user a link to this DAppNode's UI or a package, use the `my.dappnode` host (e.g. `http://my.dappnode/...`). NEVER use `dappnode.local` — it is deprecated. If docs or other context show a `dappnode.local` URL, rewrite the host to `my.dappnode` before showing it.",
    "",
    "## Staking facts you MUST NOT get wrong",
    "",
    "On DAppNode, a staking setup with a **Web3Signer** package (e.g. `web3signer-<network>.dnp.dappnode.eth`) manages validator keys AND per-validator settings through its `brain` service. In that setup:",
    "- **The fee recipient (rewards address) is configured in Web3Signer / the Staker UI, NOT in the consensus/validator client.** Web3Signer serves the fee recipient and validator registrations to the beacon node per-validator.",
    "- The validator/consensus client's `FEE_RECIPIENT_ADDRESS` env var (often `0x0000000000000000000000000000000000000000`) is only a **fallback** that is overridden by Web3Signer. A `0x0` value there is **NORMAL and does NOT mean the setup is misconfigured** — do NOT report it as a problem or tell the user their rewards are being burned. The real, effective fee recipient is whatever Web3Signer holds (this is what shows up on-chain / on beaconcha.in).",
    "- To read or change the fee recipient, point the user to Web3Signer's config / the Staker config page — not the consensus client's env vars.",
    "- Likewise, MEV-Boost relay registration is handled through Web3Signer/Staker config. If beaconcha.in shows a correct fee recipient, the setup is working regardless of the client's fallback env value.",
    ""
  ];

  const pageBlock = describePageContext(pageContext);
  if (pageBlock) parts.push(pageBlock);

  if (docsIndex) {
    parts.push("================ DAPPNODE DOCS — INDEX ONLY (from docs.dappnode.io/llms.txt) ================");
    parts.push(
      "This is the catalogue of available pages, NOT the docs themselves. To read a page's contents, call `dappnode_search_docs` or `dappnode_fetch_doc`."
    );
    parts.push("");
    parts.push(docsIndex);
    parts.push("================ END DAPPNODE DOCS INDEX ================");
    parts.push("");
  }

  parts.push("================ INSTALLED PACKAGES ON THIS DAPPNODE ================");
  parts.push(packageList);
  parts.push("================ END INSTALLED PACKAGES ================");
  parts.push("");

  // Surface the available MCP tools so the model knows what it can call.
  const mutating = dappnodeToolList.filter((t) => t.mutating).map((t) => t.name);
  if (mutating.length) {
    parts.push(
      `When invoking a MUTATING tool (${mutating.join(", ")}) you MUST first summarize the planned action in plain text and ask the user for explicit confirmation. NEVER invoke a mutating tool on the first turn without confirmation.`
    );
  }

  return parts.join("\n");
}

function readStatus(): NexusStatus {
  return {
    configured: getApiKey() !== "",
    gatewayUrl: getGatewayUrl(),
    defaultModel: getDefaultModel(),
    keySource: getApiKeySource()
  };
}

/** GET /nexus/status — surfaces config for the UI. */
export const nexusStatus = wrapHandler(async (_req: Request, res: ExpressResponse) => {
  res.status(200).json(readStatus());
});

/**
 * Probes the Nexus gateway with a candidate key by listing models. Returns
 * `null` on success, or a human-readable error string otherwise — so we never
 * persist a key that can't actually talk to the gateway.
 */
async function validateApiKey(apiKey: string): Promise<string | null> {
  let upstream: Awaited<ReturnType<typeof fetch>>;
  try {
    upstream = await fetch(`${getGatewayUrl()}/models`, {
      headers: { accept: "application/json", authorization: `Bearer ${apiKey}` }
    });
  } catch (err) {
    return err instanceof Error ? err.message : "Failed to reach the Nexus gateway";
  }
  if (upstream.status === 401 || upstream.status === 403) {
    return "The Nexus gateway rejected this API key";
  }
  if (!upstream.ok) {
    return `Nexus gateway error (${upstream.status})`;
  }
  return null;
}

/**
 * POST /nexus/config — set the Nexus API key from the admin UI.
 * Body: { apiKey: string }. The key is validated against the gateway before
 * being persisted, so a bad key is rejected with 400 rather than stored.
 */
export const nexusSetApiKey = wrapHandler(async (req: Request, res: ExpressResponse) => {
  const body = (req.body ?? {}) as { apiKey?: unknown };
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (!apiKey) {
    res.status(400).json({ error: { code: "invalid_request", message: "apiKey is required" } });
    return;
  }

  const error = await validateApiKey(apiKey);
  if (error) {
    res.status(400).json({ error: { code: "invalid_api_key", message: error } });
    return;
  }

  db.nexusApiKey.set(apiKey);
  res.status(200).json(readStatus());
});

/**
 * DELETE /nexus/config — clear the in-app Nexus API key.
 */
export const nexusClearApiKey = wrapHandler(async (_req: Request, res: ExpressResponse) => {
  db.nexusApiKey.set("");
  res.status(200).json(readStatus());
});

/* ──────────────────────────────────────────────────────────────────── *
 * Chat history — server-side persistence in dbCache so conversations
 * survive reloads. Capped at MAX_HISTORY entries (oldest pruned).
 * ──────────────────────────────────────────────────────────────────── */

const MAX_HISTORY_ENTRIES = 50;
const MAX_TITLE_LENGTH = 80;

function deriveTitle(messages: { role: string; content: string }[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  const raw = firstUser?.content?.trim() ?? "";
  if (!raw) return "New chat";
  const oneLine = raw.replace(/\s+/g, " ");
  return oneLine.length > MAX_TITLE_LENGTH ? oneLine.slice(0, MAX_TITLE_LENGTH) + "…" : oneLine;
}

interface HistorySummary {
  id: string;
  title: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

/** GET /nexus/chat/history — list of conversations sorted newest first. */
export const nexusChatHistoryList = wrapHandler(async (_req: Request, res: ExpressResponse) => {
  const all = db.nexusChatHistory.getAll();
  const summaries: HistorySummary[] = Object.values(all)
    .map((c) => ({
      id: c.id,
      title: c.title,
      messageCount: c.messages.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  res.status(200).json({ data: summaries });
});

/** GET /nexus/chat/history/:id — full conversation. */
export const nexusChatHistoryGet = wrapHandler(async (req: Request, res: ExpressResponse) => {
  const id = String(req.params.id || "");
  if (!id) {
    res.status(400).json({ error: { code: "invalid_request", message: "id required" } });
    return;
  }
  const conv = db.nexusChatHistory.get(id);
  if (!conv) {
    res.status(404).json({ error: { code: "not_found", message: "conversation not found" } });
    return;
  }
  res.status(200).json(conv);
});

/**
 * PUT /nexus/chat/history/:id — upsert a conversation.
 * Body: { messages: {role, content}[], title?: string }
 */
export const nexusChatHistoryUpsert = wrapHandler(async (req: Request, res: ExpressResponse) => {
  const id = String(req.params.id || "");
  if (!id) {
    res.status(400).json({ error: { code: "invalid_request", message: "id required" } });
    return;
  }

  const body = (req.body ?? {}) as { title?: unknown; messages?: unknown };
  if (!Array.isArray(body.messages)) {
    res.status(400).json({
      error: { code: "invalid_request", message: "messages must be an array" }
    });
    return;
  }

  const messages = (body.messages as unknown[])
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const m = raw as { role?: unknown; content?: unknown };
      if ((m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return null;
      return { role: m.role, content: m.content };
    })
    .filter((m): m is { role: "user" | "assistant"; content: string } => m !== null);

  const existing = db.nexusChatHistory.get(id);
  const now = Date.now();
  const titleArg = typeof body.title === "string" ? body.title.trim() : "";
  const title = titleArg || existing?.title || deriveTitle(messages);

  const conv = {
    id,
    title,
    messages,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  db.nexusChatHistory.set(id, conv);

  // Prune oldest entries beyond MAX_HISTORY_ENTRIES.
  const all = Object.values(db.nexusChatHistory.getAll());
  if (all.length > MAX_HISTORY_ENTRIES) {
    const toPrune = [...all].sort((a, b) => b.updatedAt - a.updatedAt).slice(MAX_HISTORY_ENTRIES);
    for (const c of toPrune) db.nexusChatHistory.remove(c.id);
  }

  res.status(200).json(conv);
});

/** DELETE /nexus/chat/history/:id — remove a conversation. */
export const nexusChatHistoryDelete = wrapHandler(async (req: Request, res: ExpressResponse) => {
  const id = String(req.params.id || "");
  if (!id) {
    res.status(400).json({ error: { code: "invalid_request", message: "id required" } });
    return;
  }
  db.nexusChatHistory.remove(id);
  res.status(204).end();
});

/**
 * POST /nexus/chat/confirm — UI callback that resolves a pending tool-call
 * confirmation surfaced earlier on the same client's SSE stream.
 * Body: { id: string, decision: "approve" | "deny", reason?: string }
 */
export const nexusChatConfirm = wrapHandler(async (req: Request, res: ExpressResponse) => {
  const body = (req.body ?? {}) as { id?: unknown; decision?: unknown; reason?: unknown };
  const id = typeof body.id === "string" ? body.id : "";
  const decision = body.decision === "approve" || body.decision === "deny" ? body.decision : null;
  if (!id || !decision) {
    res.status(400).json({
      error: { code: "invalid_request", message: "id and decision are required" }
    });
    return;
  }
  const reason = typeof body.reason === "string" ? body.reason : undefined;
  const ok = resolveConfirmation(id, decision, reason);
  res.status(ok ? 200 : 404).json({ ok });
});

/**
 * GET /nexus/models — lists chat-capable models from the configured Nexus
 * gateway. The dappmanager forwards the request with the stored API key
 * and filters the response down to models that support /v1/chat/completions.
 */
export const nexusListModels = wrapHandler(async (_req: Request, res: ExpressResponse) => {
  if (!getApiKey()) {
    res.status(503).json({
      error: { code: "nexus_not_configured", message: "Nexus API key is not configured on this DAppNode" }
    });
    return;
  }

  let upstream: Awaited<ReturnType<typeof fetch>>;
  try {
    upstream = await fetch(`${getGatewayUrl()}/models`, {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${getApiKey()}`
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reach Nexus gateway";
    logs.warn(`nexus proxy: models fetch failed: ${message}`);
    res.status(502).json({ error: { code: "upstream_unreachable", message } });
    return;
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    logs.warn(`nexus proxy: models upstream ${upstream.status}: ${text.slice(0, 200)}`);
    res
      .status(upstream.status || 502)
      .type(upstream.headers.get("content-type") || "application/json")
      .send(text || JSON.stringify({ error: { code: "upstream_error", message: upstream.statusText } }));
    return;
  }

  const payload = (await upstream.json()) as { data?: GatewayModel[] };
  const all = Array.isArray(payload.data) ? payload.data : [];
  // The gateway lists endpoints as `chat/completions` (relative) — older
  // clients may have seen `/v1/chat/completions`. Match by suffix so either
  // shape passes.
  const chatModels = all.filter(
    (m) => Array.isArray(m.endpoints) && m.endpoints.some((ep) => ep.endsWith("chat/completions"))
  );

  res.status(200).json({ data: chatModels });
});

interface GatewayModel {
  id: string;
  display_name?: string;
  description?: string;
  kind?: string;
  endpoints?: string[];
  features?: string[];
  context_size?: number;
  max_output_tokens?: number;
  input_price_per_1m_tokens_cents?: number;
  output_price_per_1m_tokens_cents?: number;
}

/**
 * POST /nexus/chat/completions — OpenAI-compatible proxy. Streams the
 * upstream SSE response straight back to the client; non-streaming
 * responses are forwarded as JSON.
 */
export async function nexusChatCompletions(req: Request, res: ExpressResponse): Promise<void> {
  const status = readStatus();

  if (!status.configured) {
    res.status(503).json({
      error: { code: "nexus_not_configured", message: "Nexus API key is not configured on this DAppNode" },
      status
    });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  if (!body.model || typeof body.model !== "string") {
    body.model = status.defaultModel;
  }

  // Pull the dappmanager-only `dappmanager_page` field off the body so we
  // don't forward an unknown key to the upstream gateway.
  const pageContext = body.dappmanager_page;
  delete body.dappmanager_page;

  const requestedStream = body.stream === true;
  // Default to streaming if the caller didn't say otherwise — it's the
  // experience the UI is built around.
  if (body.stream === undefined) {
    body.stream = true;
  }

  // Inject the Dappnode system prompt at the head of the conversation so the
  // model has docs + this node's installed-package list every turn. If the
  // client already supplied a system message, keep it after ours.
  try {
    const systemPrompt = await buildSystemPrompt(pageContext);
    const incoming = Array.isArray(body.messages) ? (body.messages as unknown[]) : [];
    body.messages = [{ role: "system", content: systemPrompt }, ...incoming];
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    logs.warn(`nexus: failed to build system prompt: ${message}`);
    // Fall through with the user's messages untouched — the chat still works.
  }

  // Attach the dappnode MCP tools so the model can drive the node. Honour
  // any explicit `tool_choice: "none"` from the caller.
  if (body.tool_choice !== "none" && !Array.isArray(body.tools)) {
    body.tools = getOpenAITools();
  }

  // Forward an abort signal so the upstream call is cancelled when the
  // browser disconnects mid-stream.
  const ac = new AbortController();
  const onClose = () => ac.abort();
  req.on("close", onClose);

  try {
    if (!requestedStream && body.stream === false) {
      // Non-streaming path: single shot, no tool loop.
      const upstream = await fetch(`${status.gatewayUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          authorization: `Bearer ${getApiKey()}`
        },
        body: JSON.stringify(body),
        signal: ac.signal
      });
      const text = await upstream.text();
      res
        .status(upstream.status)
        .type(upstream.headers.get("content-type") || "application/json")
        .send(text);
      return;
    }

    await runChatToolLoop(res, body, ac.signal);
  } catch (err) {
    if (!ac.signal.aborted && !res.writableEnded) {
      const message = err instanceof Error ? err.message : "stream error";
      logs.warn(`nexus proxy: ${message}`);
      try {
        res.write(`data: ${JSON.stringify({ error: { code: "stream_error", message } })}\n\n`);
        res.write("data: [DONE]\n\n");
      } catch {
        /* swallow */
      }
    }
  } finally {
    req.off("close", onClose);
    if (!res.writableEnded) res.end();
  }
}

/* ──────────────────────────────────────────────────────────────────── *
 * Tool-call loop — multi-step ReAct.
 *
 * Forwards the model's content deltas to the client as they arrive. When the
 * upstream stream ends with `finish_reason: "tool_calls"`, dispatch each
 * tool locally, append the result as a tool message, surface the activity
 * as italicised content in the client stream, and re-invoke the gateway.
 * Hard-capped at MAX_ITERATIONS to prevent runaway loops.
 * ──────────────────────────────────────────────────────────────────── */

const MAX_TOOL_ITERATIONS = 8;
const MAX_TOOL_RESULT_BYTES = 50_000;

interface AccumulatedToolCall {
  id: string;
  type: string;
  function: { name: string; arguments: string };
}

interface GatewayStreamChunk {
  model?: string;
  choices?: {
    delta?: {
      content?: string;
      tool_calls?: {
        index?: number;
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }[];
    };
    finish_reason?: string | null;
  }[];
}

async function runChatToolLoop(
  res: ExpressResponse,
  body: Record<string, unknown>,
  signal: AbortSignal
): Promise<void> {
  res.status(200);
  res.setHeader("content-type", "text/event-stream");
  res.setHeader("cache-control", "no-cache, no-transform");
  res.setHeader("x-accel-buffering", "no");
  res.flushHeaders();

  const messages: unknown[] = Array.isArray(body.messages) ? [...(body.messages as unknown[])] : [];
  let responseModelId: string | null = null;

  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    if (signal.aborted) break;

    const iterationBody = { ...body, messages, stream: true };
    const upstream = await fetch(`${getGatewayUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream",
        authorization: `Bearer ${getApiKey()}`
      },
      body: JSON.stringify(iterationBody),
      signal
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      logs.warn(`nexus proxy: upstream ${upstream.status}: ${text.slice(0, 200)}`);
      writeSyntheticContent(res, `\n\n_(upstream error ${upstream.status})_\n\n`, responseModelId);
      break;
    }

    let assistantContent = "";
    const toolCalls: AccumulatedToolCall[] = [];
    let finishReason: string | null = null;

    for await (const payload of readSSEPayloads(upstream.body)) {
      let chunk: GatewayStreamChunk;
      try {
        chunk = JSON.parse(payload) as GatewayStreamChunk;
      } catch {
        continue;
      }
      if (chunk.model && !responseModelId) responseModelId = chunk.model;

      const choice = chunk.choices?.[0];
      if (!choice) continue;
      const delta = choice.delta || {};

      if (typeof delta.content === "string" && delta.content.length > 0) {
        assistantContent += delta.content;
        if (!res.writableEnded) res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      if (Array.isArray(delta.tool_calls)) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!toolCalls[idx]) {
            toolCalls[idx] = { id: "", type: "function", function: { name: "", arguments: "" } };
          }
          if (tc.id) toolCalls[idx].id = tc.id;
          if (tc.type) toolCalls[idx].type = tc.type;
          if (tc.function?.name) toolCalls[idx].function.name += tc.function.name;
          if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
        }
      }

      if (choice.finish_reason) finishReason = choice.finish_reason;
    }

    if (signal.aborted) break;

    if (finishReason === "tool_calls" && toolCalls.length > 0) {
      // Append the assistant turn (with the tool_calls).
      messages.push({
        role: "assistant",
        content: assistantContent || null,
        tool_calls: toolCalls
      });

      for (const tc of toolCalls) {
        const toolName = tc.function.name || "(unnamed)";
        let args: unknown = {};
        try {
          args = JSON.parse(tc.function.arguments || "{}");
        } catch {
          /* fall through with {} */
        }

        const toolDef = dappnodeTools[toolName];
        const displayName = toolDef?.displayName ?? toolName;

        // Mutating tools must pass through the confirmation flow before dispatch.
        if (toolDef?.mutating) {
          const { id, promise } = createPendingConfirmation(toolName, args, signal);
          writeDappmanagerEvent(res, {
            type: "confirm_required",
            id,
            tool: toolName,
            displayName,
            args
          });
          const { decision, reason } = await promise;
          writeDappmanagerEvent(res, {
            type: "confirm_resolved",
            id,
            decision,
            reason
          });
          if (decision === "deny") {
            const reasonText = reason ? ` — ${reason}` : "";
            writeSyntheticContent(res, `\n\n_Skipped **${displayName}**${reasonText}_\n\n`, responseModelId);
            messages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({ error: "user_denied", reason: reason ?? null })
            });
            continue;
          }
        }

        writeSyntheticContent(res, `\n\n_Running **${displayName}**…_\n\n`, responseModelId);

        const result = await dispatchTool(toolName, args);
        const payload = JSON.stringify(result.ok ? result.output : { error: result.error });
        const content =
          payload.length > MAX_TOOL_RESULT_BYTES ? payload.slice(0, MAX_TOOL_RESULT_BYTES) + "…(truncated)" : payload;

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content
        });
      }

      // Loop to next iteration.
      continue;
    }

    // Terminal finish — flush [DONE] and exit.
    if (!res.writableEnded) res.write("data: [DONE]\n\n");
    return;
  }

  // Safety limit / aborted.
  if (!res.writableEnded) res.write("data: [DONE]\n\n");
}

async function* readSSEPayloads(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const event = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        for (const line of event.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload && payload !== "[DONE]") yield payload;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function writeSyntheticContent(res: ExpressResponse, text: string, modelId: string | null): void {
  if (res.writableEnded) return;
  const chunk = {
    id: "dappmanager",
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: modelId,
    choices: [{ index: 0, delta: { content: text }, finish_reason: null }]
  };
  res.write(`data: ${JSON.stringify(chunk)}\n\n`);
}

/**
 * Out-of-band signal to the browser — not an OpenAI chunk. Distinguished
 * client-side by the top-level `dappmanager` key.
 */
function writeDappmanagerEvent(res: ExpressResponse, payload: unknown): void {
  if (res.writableEnded) return;
  res.write(`data: ${JSON.stringify({ dappmanager: payload })}\n\n`);
}
