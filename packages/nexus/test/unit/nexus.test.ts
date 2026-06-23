import { expect } from "chai";
import { NexusApi, NexusApiError, canonicalDocUrl, stripMdFromDocsUrls, trimTrailingSlashes } from "../../src/index.js";
import type {
  FetchLike,
  NexusHistoryStore,
  NexusMcpAdapter,
  NexusStoredConversation,
  NexusStreamWriter
} from "../../src/index.js";

describe("nexus / api", () => {
  it("normalizes docs URLs without regex-style trailing slash trimming", () => {
    expect(trimTrailingSlashes("https://example.com///")).to.equal("https://example.com");
    expect(canonicalDocUrl("https://docs.dappnode.io/docs/wireguard.md/")).to.equal(
      "https://docs.dappnode.io/docs/wireguard"
    );
    expect(stripMdFromDocsUrls("- [Wireguard](https://docs.dappnode.io/docs/wireguard.md): VPN")).to.equal(
      "- [Wireguard](https://docs.dappnode.io/docs/wireguard): VPN"
    );
  });

  it("validates and stores a Nexus API key without leaking it in status", async () => {
    const { service, state } = makeService({
      fetch: async (url) => {
        expect(String(url)).to.equal("https://gateway.example/v1/models");
        return jsonResponse({ data: [] });
      }
    });

    const status = await service.setApiKey(" secret-key ");

    expect(state.apiKey).to.equal("secret-key");
    expect(status).to.deep.equal({
      configured: true,
      gatewayUrl: "https://gateway.example/v1",
      defaultModel: "nexus/test",
      keySource: "db"
    });
    expect(JSON.stringify(status)).to.not.include("secret-key");
  });

  it("filters model list to chat-completions capable models", async () => {
    const { service } = makeService({
      apiKey: "secret",
      fetch: async () =>
        jsonResponse({
          data: [
            { id: "chat", endpoints: ["chat/completions"] },
            { id: "legacy-chat", endpoints: ["/v1/chat/completions"] },
            { id: "embed", endpoints: ["embeddings"] }
          ]
        })
    });

    const models = await service.listModels();

    expect(models.map((model) => model.id)).to.deep.equal(["chat", "legacy-chat"]);
  });

  it("upserts, lists, deletes, and prunes chat history", () => {
    let now = 1000;
    const { service, state } = makeService({ now: () => now++ });

    const first = service.upsertHistory("first", {
      messages: [{ role: "user", content: "hello      nexus" }]
    });
    expect(first.title).to.equal("hello nexus");
    expect(service.listHistory()).to.have.length(1);

    service.deleteHistory("first");
    expect(service.listHistory()).to.deep.equal([]);

    for (let i = 0; i < 51; i++) {
      service.upsertHistory(`c${i}`, { messages: [{ role: "user", content: `message ${i}` }] });
    }

    expect(Object.keys(state.history)).to.have.length(50);
    expect(state.history.c0).to.equal(undefined);
  });

  it("runs a read-only tool loop and resumes the upstream chat", async () => {
    const writer = new MemoryWriter();
    const dispatched: unknown[] = [];
    const chatResponses = [
      sseResponse([
        {
          model: "model-a",
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    id: "call-1",
                    type: "function",
                    function: { name: "read_tool", arguments: '{"dnpName":"pkg"}' }
                  }
                ]
              },
              finish_reason: null
            }
          ]
        },
        { choices: [{ delta: {}, finish_reason: "tool_calls" }] }
      ]),
      sseResponse([{ model: "model-a", choices: [{ delta: { content: "Done" }, finish_reason: "stop" }] }])
    ];
    const { service } = makeService({
      apiKey: "secret",
      mcp: {
        toolList: [{ name: "read_tool", displayName: "Read tool" }],
        getOpenAITools: () => [],
        dispatchTool: async (name, args) => {
          dispatched.push({ name, args });
          return { ok: true, output: { ok: true } };
        },
        createPendingConfirmation: () => {
          throw new Error("unexpected confirmation");
        },
        resolveConfirmation: () => false
      },
      fetch: async (url) => {
        if (String(url).endsWith("/llms.txt")) return textResponse("");
        return chatResponses.shift() ?? sseResponse([]);
      }
    });

    await service.chatCompletions(
      { messages: [{ role: "user", content: "hi" }] },
      writer,
      new AbortController().signal
    );

    expect(dispatched).to.deep.equal([{ name: "read_tool", args: { dnpName: "pkg" } }]);
    expect(writer.body).to.include("Running **Read tool**");
    expect(writer.body).to.include("Done");
    expect(writer.body).to.include("[DONE]");
  });

  it("denies a mutating tool when confirmation is denied", async () => {
    const writer = new MemoryWriter();
    const chatResponses = [
      sseResponse([
        {
          model: "model-a",
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    id: "call-1",
                    type: "function",
                    function: { name: "mutating_tool", arguments: "{}" }
                  }
                ]
              },
              finish_reason: null
            }
          ]
        },
        { choices: [{ delta: {}, finish_reason: "tool_calls" }] }
      ]),
      sseResponse([{ model: "model-a", choices: [{ delta: { content: "Skipped" }, finish_reason: "stop" }] }])
    ];
    const { service } = makeService({
      apiKey: "secret",
      mcp: {
        toolList: [{ name: "mutating_tool", displayName: "Mutating tool", mutating: true }],
        getOpenAITools: () => [],
        dispatchTool: async () => {
          throw new Error("dispatch should not run");
        },
        createPendingConfirmation: () => ({
          id: "confirm-1",
          promise: Promise.resolve({ decision: "deny", reason: "not now" })
        }),
        resolveConfirmation: () => false
      },
      fetch: async (url) => {
        if (String(url).endsWith("/llms.txt")) return textResponse("");
        return chatResponses.shift() ?? sseResponse([]);
      }
    });

    await service.chatCompletions({ messages: [] }, writer, new AbortController().signal);

    expect(writer.body).to.include("confirm_required");
    expect(writer.body).to.include("Skipped **Mutating tool** - not now");
  });

  it("writes an upstream error into the stream", async () => {
    const writer = new MemoryWriter();
    const { service } = makeService({
      apiKey: "secret",
      fetch: async (url) => {
        if (String(url).endsWith("/llms.txt")) return textResponse("");
        return textResponse("bad gateway", 502);
      }
    });

    await service.chatCompletions({ messages: [] }, writer, new AbortController().signal);

    expect(writer.body).to.include("upstream error 502");
    expect(writer.body).to.include("[DONE]");
  });

  it("throws a structured error when chat is not configured", async () => {
    const { service } = makeService();

    try {
      await service.chatCompletions({ messages: [] }, new MemoryWriter(), new AbortController().signal);
      throw new Error("expected error");
    } catch (err) {
      expect(err).to.be.instanceOf(NexusApiError);
      expect((err as NexusApiError).statusCode).to.equal(503);
      expect((err as NexusApiError).payload?.status?.configured).to.equal(false);
    }
  });
});

function makeService({
  apiKey = "",
  fetch = async () => jsonResponse({ data: [] }),
  now = () => 1000,
  mcp
}: {
  apiKey?: string;
  fetch?: FetchLike;
  now?: () => number;
  mcp?: NexusMcpAdapter;
} = {}): { service: NexusApi; state: { apiKey: string; history: Record<string, NexusStoredConversation> } } {
  const state = { apiKey, history: {} as Record<string, NexusStoredConversation> };
  const historyStore: NexusHistoryStore = {
    getAll: () => state.history,
    get: (id) => state.history[id],
    set: (id, value) => {
      state.history[id] = value;
    },
    remove: (id) => {
      delete state.history[id];
    }
  };
  const service = new NexusApi({
    apiKeyStore: {
      get: () => state.apiKey,
      set: (value) => {
        state.apiKey = value;
      }
    },
    historyStore,
    listPackages: async () => [],
    logger: { info: () => {}, warn: () => {} },
    mcp: mcp ?? {
      toolList: [],
      getOpenAITools: () => [],
      dispatchTool: async () => ({ ok: true, output: {} }),
      createPendingConfirmation: () => ({ id: "confirm", promise: Promise.resolve({ decision: "approve" }) }),
      resolveConfirmation: () => false
    },
    fetch,
    now,
    getGatewayUrl: () => "https://gateway.example/v1///",
    getDefaultModel: () => "nexus/test"
  });
  return { service, state };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "content-type": "text/plain" } });
}

function sseResponse(chunks: unknown[]): Response {
  const body = chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("") + "data: [DONE]\n\n";
  return new Response(body, { headers: { "content-type": "text/event-stream" } });
}

class MemoryWriter implements NexusStreamWriter {
  writableEnded = false;
  statusCode = 0;
  headers: Record<string, string> = {};
  body = "";

  status(code: number): void {
    this.statusCode = code;
  }

  setHeader(name: string, value: string): void {
    this.headers[name.toLowerCase()] = value;
  }

  flushHeaders(): void {}

  write(chunk: string): void {
    this.body += chunk;
  }
}
