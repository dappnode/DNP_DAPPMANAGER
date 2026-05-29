/**
 * Browser-side client for the DAppNode-hosted Nexus chat proxy.
 *
 * The dappmanager backend holds the Nexus API key and proxies every request,
 * so this module just talks to same-origin endpoints.
 */

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface NexusStatus {
  configured: boolean;
  gatewayUrl: string;
  defaultModel: string;
}

const STATUS_URL = "/nexus/status";
const MODELS_URL = "/nexus/models";
const CHAT_URL = "/nexus/chat/completions";
const CONFIRM_URL = "/nexus/chat/confirm";
const HISTORY_URL = "/nexus/chat/history";

export interface NexusModel {
  id: string;
  display_name?: string;
  description?: string;
  kind?: string;
  context_size?: number;
  max_output_tokens?: number;
  input_price_per_1m_tokens_cents?: number;
  output_price_per_1m_tokens_cents?: number;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      detail = body?.error?.message ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(detail || `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export function getNexusStatus(): Promise<NexusStatus> {
  return fetchJson<NexusStatus>(STATUS_URL);
}

export async function listNexusModels(): Promise<NexusModel[]> {
  const res = await fetchJson<{ data?: NexusModel[] }>(MODELS_URL);
  return Array.isArray(res.data) ? res.data : [];
}

/** Approve / deny a pending tool-call surfaced on the SSE stream. */
export function submitChatConfirmation(
  id: string,
  decision: "approve" | "deny",
  reason?: string
): Promise<{ ok: boolean }> {
  return fetchJson<{ ok: boolean }>(CONFIRM_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, decision, reason })
  });
}

/* ------------------------------------------------------------------ *
 * Chat history
 * ------------------------------------------------------------------ */

export interface ChatHistorySummary {
  id: string;
  title: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface StoredConversation extends ChatHistorySummary {
  messages: ChatMessage[];
}

export async function listChatHistory(): Promise<ChatHistorySummary[]> {
  const res = await fetchJson<{ data?: ChatHistorySummary[] }>(HISTORY_URL);
  return Array.isArray(res.data) ? res.data : [];
}

export function loadConversation(id: string): Promise<StoredConversation> {
  return fetchJson<StoredConversation>(`${HISTORY_URL}/${encodeURIComponent(id)}`);
}

export function saveConversation(
  id: string,
  messages: ChatMessage[],
  title?: string
): Promise<StoredConversation> {
  return fetchJson<StoredConversation>(`${HISTORY_URL}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, title })
  });
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${HISTORY_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include"
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete conversation: ${res.status}`);
  }
}

/* ------------------------------------------------------------------ *
 * Chat completion (SSE)
 * ------------------------------------------------------------------ */

interface OpenAIDelta {
  choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
  error?: { message?: string; type?: string };
}

interface ChatErrorBody {
  error?: { code?: string; message?: string };
  status?: NexusStatus;
}

/** Raised when the gateway refuses the request before any tokens arrive. */
export class ChatError extends Error {
  code: string;
  status?: NexusStatus;
  constructor(message: string, code: string, status?: NexusStatus) {
    super(message);
    this.name = "ChatError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Tells the server which page of the admin UI the user is looking at when
 * they send the message. Travels alongside the OpenAI body and is appended
 * to the system prompt by the proxy so the model can resolve vague queries
 * ("what is this page?", "what does this do?") without a round-trip.
 */
export interface ChatPageContext {
  path: string;
  search?: string;
  hash?: string;
  title?: string;
}

export interface StreamChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  pageContext?: ChatPageContext;
}

/**
 * What `streamChat` yields. Text deltas (`type: "content"`) are paced by
 * `smoothStream`; control events (`confirm_required` / `confirm_resolved`)
 * pass through immediately so the UI can react without typing-delay.
 */
export type StreamEvent =
  | { type: "content"; delta: string }
  | { type: "confirm_required"; id: string; tool: string; displayName: string; args: unknown }
  | { type: "confirm_resolved"; id: string; decision: "approve" | "deny"; reason?: string };

interface DappmanagerEvent {
  type?: string;
  id?: string;
  tool?: string;
  displayName?: string;
  args?: unknown;
  decision?: "approve" | "deny";
  reason?: string;
}

/**
 * Splits an SSE `text/event-stream` body into the inner `data:` payloads.
 * `:` comment lines are skipped and the `[DONE]` terminator is filtered out.
 */
async function* readSSE(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
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

/** Calls the dappmanager proxy and yields typed stream events. */
export async function* streamChat(options: StreamChatOptions): AsyncGenerator<StreamEvent> {
  const res = await fetch(CHAT_URL, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: true,
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(options.maxTokens !== undefined ? { max_tokens: options.maxTokens } : {}),
      ...(options.pageContext ? { dappmanager_page: options.pageContext } : {})
    }),
    signal: options.signal
  });

  if (!res.ok) {
    let parsed: ChatErrorBody | undefined;
    try {
      parsed = (await res.json()) as ChatErrorBody;
    } catch {
      /* ignore */
    }
    const code = parsed?.error?.code ?? `http_${res.status}`;
    const message = parsed?.error?.message ?? `Request failed (${res.status})`;
    throw new ChatError(message, code, parsed?.status);
  }

  if (!res.body) throw new ChatError("Empty response body", "no_body");

  for await (const payload of readSSE(res.body)) {
    let chunk: OpenAIDelta & { dappmanager?: DappmanagerEvent };
    try {
      chunk = JSON.parse(payload) as OpenAIDelta & { dappmanager?: DappmanagerEvent };
    } catch {
      continue;
    }

    // Out-of-band dappmanager events ride alongside OpenAI chunks.
    if (chunk.dappmanager) {
      const ev = chunk.dappmanager;
      if (ev.type === "confirm_required" && typeof ev.id === "string" && typeof ev.tool === "string") {
        yield {
          type: "confirm_required",
          id: ev.id,
          tool: ev.tool,
          displayName: typeof ev.displayName === "string" && ev.displayName ? ev.displayName : ev.tool,
          args: ev.args
        };
      } else if (ev.type === "confirm_resolved" && typeof ev.id === "string" && (ev.decision === "approve" || ev.decision === "deny")) {
        yield { type: "confirm_resolved", id: ev.id, decision: ev.decision, reason: ev.reason };
      }
      continue;
    }

    if (chunk.error) throw new ChatError(chunk.error.message ?? "stream error", "stream_error");
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) yield { type: "content", delta };
  }
}

/* ------------------------------------------------------------------ *
 * Smooth streaming — re-paces bursty network deltas into a steady,
 * letter-level reveal. Drains proportionally so it catches up fast when
 * far behind and eases to a single-character finish at the end.
 * ------------------------------------------------------------------ */

const FRAME_MS = 16;

export async function* smoothStream(
  source: AsyncGenerator<StreamEvent>,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  let pending = "";
  let finished = false;
  let failure: unknown = null;
  const sidecar: StreamEvent[] = [];

  const pump = (async () => {
    try {
      for await (const event of source) {
        if (event.type === "content") pending += event.delta;
        else sidecar.push(event);
      }
    } catch (err) {
      failure = err;
    } finally {
      finished = true;
    }
  })();

  const nextFrame = () => new Promise<void>((resolve) => setTimeout(resolve, FRAME_MS));

  try {
    while (!signal?.aborted) {
      // Non-content events fire immediately — they're UI signals, not text.
      while (sidecar.length > 0) yield sidecar.shift()!;

      if (pending.length > 0) {
        const take = Math.max(1, Math.ceil(pending.length / 10));
        yield { type: "content", delta: pending.slice(0, take) };
        pending = pending.slice(take);
        await nextFrame();
        continue;
      }
      if (finished) break;
      await nextFrame();
    }
    while (sidecar.length > 0) yield sidecar.shift()!;
  } finally {
    await pump;
  }

  if (failure) throw failure;
}
