import { NexusContextBuilder } from "./context.js";
import type {
  FetchLike,
  GatewayModel,
  HistorySummary,
  NexusRawResponse,
  NexusApiDeps,
  NexusStatus,
  NexusStoredChatMessage,
  NexusStoredConversation,
  NexusStreamWriter,
  NexusToolSummary
} from "./types.js";
import { collapseWhitespace, trimAsciiWhitespace, trimTrailingSlashes } from "./utils.js";

const DEFAULT_GATEWAY_URL = "https://nexus-api.dappnode.com/v1";
const DEFAULT_MODEL = "nexus/auto";
const MAX_HISTORY_ENTRIES = 50;
const MAX_TITLE_LENGTH = 80;
const MAX_TOOL_ITERATIONS = 8;
const MAX_TOOL_RESULT_BYTES = 50_000;

interface ErrorPayload {
  error: { code: string; message: string };
  status?: NexusStatus;
}

export class NexusApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly payload?: ErrorPayload;
  readonly rawBody?: string;
  readonly contentType?: string;

  constructor({
    statusCode,
    code,
    message,
    payload,
    rawBody,
    contentType
  }: {
    statusCode: number;
    code: string;
    message: string;
    payload?: ErrorPayload;
    rawBody?: string;
    contentType?: string;
  }) {
    super(message);
    this.name = "NexusApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.payload = payload;
    this.rawBody = rawBody;
    this.contentType = contentType;
  }

  static json(statusCode: number, code: string, message: string, status?: NexusStatus): NexusApiError {
    return new NexusApiError({
      statusCode,
      code,
      message,
      payload: { error: { code, message }, status }
    });
  }

  static raw(statusCode: number, body: string, contentType: string | null, fallbackMessage: string): NexusApiError {
    return new NexusApiError({
      statusCode,
      code: "upstream_error",
      message: fallbackMessage,
      rawBody: body,
      contentType: contentType || "application/json"
    });
  }
}

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

export class NexusApi {
  private readonly fetchImpl: FetchLike;
  private readonly now: () => number;
  private readonly context: NexusContextBuilder;
  private readonly toolsByName: Map<string, NexusToolSummary>;

  constructor(private readonly deps: NexusApiDeps) {
    this.fetchImpl = deps.fetch ?? fetch;
    this.now = deps.now ?? Date.now;
    this.context = new NexusContextBuilder({
      fetch: this.fetchImpl,
      logger: deps.logger,
      now: this.now,
      listPackages: deps.listPackages,
      toolList: deps.mcp.toolList,
      startDocsWarmup: deps.startDocsWarmup
    });
    this.toolsByName = new Map(deps.mcp.toolList.map((tool) => [tool.name, tool]));
  }

  readStatus(): NexusStatus {
    return {
      configured: this.getApiKey() !== "",
      gatewayUrl: this.getGatewayUrl(),
      defaultModel: this.getDefaultModel(),
      keySource: this.getApiKey() ? "db" : "none"
    };
  }

  async setApiKey(rawApiKey: unknown): Promise<NexusStatus> {
    const apiKey = typeof rawApiKey === "string" ? rawApiKey.trim() : "";
    if (!apiKey) throw NexusApiError.json(400, "invalid_request", "apiKey is required");

    const error = await this.validateApiKey(apiKey);
    if (error) throw NexusApiError.json(400, "invalid_api_key", error);

    this.deps.apiKeyStore.set(apiKey);
    return this.readStatus();
  }

  clearApiKey(): NexusStatus {
    this.deps.apiKeyStore.set("");
    return this.readStatus();
  }

  listHistory(): HistorySummary[] {
    const all = this.deps.historyStore.getAll();
    return Object.values(all)
      .map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        messageCount: conversation.messages.length,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getHistory(id: string): NexusStoredConversation {
    if (!id) throw NexusApiError.json(400, "invalid_request", "id required");
    const conversation = this.deps.historyStore.get(id);
    if (!conversation) throw NexusApiError.json(404, "not_found", "conversation not found");
    return conversation;
  }

  upsertHistory(id: string, body: unknown): NexusStoredConversation {
    if (!id) throw NexusApiError.json(400, "invalid_request", "id required");
    const parsedBody = body && typeof body === "object" ? (body as { title?: unknown; messages?: unknown }) : {};
    if (!Array.isArray(parsedBody.messages)) {
      throw NexusApiError.json(400, "invalid_request", "messages must be an array");
    }

    const messages = parseStoredMessages(parsedBody.messages);
    const existing = this.deps.historyStore.get(id);
    const now = this.now();
    const titleArg = typeof parsedBody.title === "string" ? parsedBody.title.trim() : "";
    const title = titleArg || existing?.title || deriveTitle(messages);
    const conversation: NexusStoredConversation = {
      id,
      title,
      messages,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };

    this.deps.historyStore.set(id, conversation);
    this.pruneHistory();
    return conversation;
  }

  deleteHistory(id: string): void {
    if (!id) throw NexusApiError.json(400, "invalid_request", "id required");
    this.deps.historyStore.remove(id);
  }

  clearHistory(): void {
    for (const id of Object.keys(this.deps.historyStore.getAll())) {
      this.deps.historyStore.remove(id);
    }
  }

  resolveConfirmation(body: unknown): { ok: boolean } {
    const parsedBody =
      body && typeof body === "object" ? (body as { id?: unknown; decision?: unknown; reason?: unknown }) : {};
    const id = typeof parsedBody.id === "string" ? parsedBody.id : "";
    const decision = parsedBody.decision === "approve" || parsedBody.decision === "deny" ? parsedBody.decision : null;
    if (!id || !decision) {
      throw NexusApiError.json(400, "invalid_request", "id and decision are required");
    }
    const reason = typeof parsedBody.reason === "string" ? parsedBody.reason : undefined;
    return { ok: this.deps.mcp.resolveConfirmation(id, decision, reason) };
  }

  async listModels(): Promise<GatewayModel[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw NexusApiError.json(503, "nexus_not_configured", "Nexus API key is not configured on this DAppNode");
    }

    let upstream: Awaited<ReturnType<FetchLike>>;
    try {
      upstream = await this.fetchImpl(`${this.getGatewayUrl()}/models`, {
        headers: { accept: "application/json", authorization: `Bearer ${apiKey}` }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reach Nexus gateway";
      this.deps.logger.warn(`nexus proxy: models fetch failed: ${message}`);
      throw NexusApiError.json(502, "upstream_unreachable", message);
    }

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      this.deps.logger.warn(`nexus proxy: models upstream ${upstream.status}: ${text.slice(0, 200)}`);
      throw NexusApiError.raw(
        upstream.status || 502,
        text || JSON.stringify({ error: { code: "upstream_error", message: upstream.statusText } }),
        upstream.headers.get("content-type"),
        upstream.statusText
      );
    }

    const payload = (await upstream.json()) as { data?: GatewayModel[] };
    const all = Array.isArray(payload.data) ? payload.data : [];
    return all.filter(
      (model) =>
        Array.isArray(model.endpoints) && model.endpoints.some((endpoint) => endpoint.endsWith("chat/completions"))
    );
  }

  async chatCompletions(
    rawBody: unknown,
    writer: NexusStreamWriter,
    signal: AbortSignal
  ): Promise<NexusRawResponse | void> {
    const status = this.readStatus();
    if (!status.configured) {
      throw NexusApiError.json(503, "nexus_not_configured", "Nexus API key is not configured on this DAppNode", status);
    }

    const body = rawBody && typeof rawBody === "object" ? { ...(rawBody as Record<string, unknown>) } : {};
    if (!body.model || typeof body.model !== "string") body.model = status.defaultModel;

    const pageContext = body.dappmanager_page;
    delete body.dappmanager_page;

    const requestedStream = body.stream === true;
    if (body.stream === undefined) body.stream = true;

    try {
      const systemPrompt = await this.context.buildSystemPrompt(pageContext);
      const incoming = Array.isArray(body.messages) ? (body.messages as unknown[]) : [];
      body.messages = [{ role: "system", content: systemPrompt }, ...incoming];
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      this.deps.logger.warn(`nexus: failed to build system prompt: ${message}`);
    }

    if (body.tool_choice !== "none" && !Array.isArray(body.tools)) {
      body.tools = this.deps.mcp.getOpenAITools();
    }

    if (!requestedStream && body.stream === false) {
      const upstream = await this.fetchImpl(`${status.gatewayUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          authorization: `Bearer ${this.getApiKey()}`
        },
        body: JSON.stringify(body),
        signal
      });
      return {
        statusCode: upstream.status,
        contentType: upstream.headers.get("content-type") || "application/json",
        body: await upstream.text()
      };
    }

    try {
      await this.runChatToolLoop(writer, body, signal);
    } catch (err) {
      if (!signal.aborted && !writer.writableEnded) {
        const message = err instanceof Error ? err.message : "stream error";
        this.deps.logger.warn(`nexus proxy: ${message}`);
        try {
          writer.write(`data: ${JSON.stringify({ error: { code: "stream_error", message } })}\n\n`);
          writer.write("data: [DONE]\n\n");
        } catch {
          // The client may have disconnected while the error was being written.
        }
      }
    }
  }

  private async validateApiKey(apiKey: string): Promise<string | null> {
    let upstream: Awaited<ReturnType<FetchLike>>;
    try {
      upstream = await this.fetchImpl(`${this.getGatewayUrl()}/models`, {
        headers: { accept: "application/json", authorization: `Bearer ${apiKey}` }
      });
    } catch (err) {
      return err instanceof Error ? err.message : "Failed to reach the Nexus gateway";
    }
    if (upstream.status === 401 || upstream.status === 403) return "The Nexus gateway rejected this API key";
    if (!upstream.ok) return `Nexus gateway error (${upstream.status})`;
    return null;
  }

  private async runChatToolLoop(
    writer: NexusStreamWriter,
    body: Record<string, unknown>,
    signal: AbortSignal
  ): Promise<void> {
    writer.status(200);
    writer.setHeader("content-type", "text/event-stream");
    writer.setHeader("cache-control", "no-cache, no-transform");
    writer.setHeader("x-accel-buffering", "no");
    writer.flushHeaders?.();

    const messages: unknown[] = Array.isArray(body.messages) ? [...(body.messages as unknown[])] : [];
    let responseModelId: string | null = null;

    for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
      if (signal.aborted) break;

      const iterationBody = { ...body, messages, stream: true };
      const upstream = await this.fetchImpl(`${this.getGatewayUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "text/event-stream",
          authorization: `Bearer ${this.getApiKey()}`
        },
        body: JSON.stringify(iterationBody),
        signal
      });

      if (!upstream.ok || !upstream.body) {
        const text = await upstream.text().catch(() => "");
        this.deps.logger.warn(`nexus proxy: upstream ${upstream.status}: ${text.slice(0, 200)}`);
        writeSyntheticContent(writer, `\n\n_(upstream error ${upstream.status})_\n\n`, responseModelId);
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
          if (!writer.writableEnded) writer.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        if (Array.isArray(delta.tool_calls)) {
          for (const toolCall of delta.tool_calls) {
            const idx = toolCall.index ?? 0;
            if (!toolCalls[idx]) {
              toolCalls[idx] = { id: "", type: "function", function: { name: "", arguments: "" } };
            }
            if (toolCall.id) toolCalls[idx].id = toolCall.id;
            if (toolCall.type) toolCalls[idx].type = toolCall.type;
            if (toolCall.function?.name) toolCalls[idx].function.name += toolCall.function.name;
            if (toolCall.function?.arguments) toolCalls[idx].function.arguments += toolCall.function.arguments;
          }
        }

        if (choice.finish_reason) finishReason = choice.finish_reason;
      }

      if (signal.aborted) break;

      if (finishReason === "tool_calls" && toolCalls.length > 0) {
        messages.push({ role: "assistant", content: assistantContent || null, tool_calls: toolCalls });

        for (const toolCall of toolCalls) {
          const toolName = toolCall.function.name || "(unnamed)";
          let args: unknown = {};
          try {
            args = JSON.parse(toolCall.function.arguments || "{}");
          } catch {
            // Leave args as an empty object; dispatch validation will surface the failure.
          }

          const toolDef = this.toolsByName.get(toolName);
          const displayName = toolDef?.displayName ?? toolName;

          if (toolDef?.mutating) {
            const { id, promise } = this.deps.mcp.createPendingConfirmation(toolName, args, signal);
            writeDappmanagerEvent(writer, { type: "confirm_required", id, tool: toolName, displayName, args });
            const { decision, reason } = await promise;
            writeDappmanagerEvent(writer, { type: "confirm_resolved", id, decision, reason });
            if (decision === "deny") {
              const reasonText = reason ? ` - ${reason}` : "";
              writeSyntheticContent(writer, `\n\n_Skipped **${displayName}**${reasonText}_\n\n`, responseModelId);
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify({ error: "user_denied", reason: reason ?? null })
              });
              continue;
            }
          }

          writeSyntheticContent(writer, `\n\n_Running **${displayName}**..._\n\n`, responseModelId);

          const result = await this.deps.mcp.dispatchTool(toolName, args);
          const payload = JSON.stringify(result.ok ? result.output : { error: result.error });
          const content =
            payload.length > MAX_TOOL_RESULT_BYTES
              ? payload.slice(0, MAX_TOOL_RESULT_BYTES) + "...(truncated)"
              : payload;

          messages.push({ role: "tool", tool_call_id: toolCall.id, content });
        }

        continue;
      }

      if (!writer.writableEnded) writer.write("data: [DONE]\n\n");
      return;
    }

    if (!writer.writableEnded) writer.write("data: [DONE]\n\n");
  }

  private getGatewayUrl(): string {
    const raw = this.deps.getGatewayUrl?.() || DEFAULT_GATEWAY_URL;
    return trimTrailingSlashes(raw);
  }

  private getDefaultModel(): string {
    return this.deps.getDefaultModel?.() || DEFAULT_MODEL;
  }

  private getApiKey(): string {
    return this.deps.apiKeyStore.get();
  }

  private pruneHistory(): void {
    const all = Object.values(this.deps.historyStore.getAll());
    if (all.length <= MAX_HISTORY_ENTRIES) return;
    const toPrune = [...all].sort((a, b) => b.updatedAt - a.updatedAt).slice(MAX_HISTORY_ENTRIES);
    for (const conversation of toPrune) this.deps.historyStore.remove(conversation.id);
  }
}

export { NexusApi as NexusService, NexusApiError as NexusServiceError };

function parseStoredMessages(messages: unknown[]): NexusStoredChatMessage[] {
  return messages
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const message = raw as { role?: unknown; content?: unknown };
      if ((message.role !== "user" && message.role !== "assistant") || typeof message.content !== "string") return null;
      return { role: message.role, content: message.content };
    })
    .filter((message): message is NexusStoredChatMessage => message !== null);
}

function deriveTitle(messages: { role: string; content: string }[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  const raw = firstUser?.content?.trim() ?? "";
  if (!raw) return "New chat";
  const oneLine = collapseWhitespace(raw);
  return oneLine.length > MAX_TITLE_LENGTH ? oneLine.slice(0, MAX_TITLE_LENGTH) + "..." : oneLine;
}

async function* readSSEPayloads(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).split("\r\n").join("\n");
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const event = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        for (const line of event.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = trimAsciiWhitespace(line.slice(5));
          if (payload && payload !== "[DONE]") yield payload;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function writeSyntheticContent(writer: NexusStreamWriter, text: string, modelId: string | null): void {
  if (writer.writableEnded) return;
  const chunk = {
    id: "dappmanager",
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: modelId,
    choices: [{ index: 0, delta: { content: text }, finish_reason: null }]
  };
  writer.write(`data: ${JSON.stringify(chunk)}\n\n`);
}

function writeDappmanagerEvent(writer: NexusStreamWriter, payload: unknown): void {
  if (writer.writableEnded) return;
  writer.write(`data: ${JSON.stringify({ dappmanager: payload })}\n\n`);
}
