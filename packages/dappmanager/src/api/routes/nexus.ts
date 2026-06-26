import type { Request, Response as ExpressResponse } from "express";
import * as db from "@dappnode/db";
import { listPackages } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { NexusApi, NexusApiError } from "@dappnode/nexus";
import { wrapHandler } from "../utils.js";
import { dappnodeToolList } from "../../mcp/tools.js";
import { dispatchTool, getOpenAITools } from "../../mcp/dispatch.js";
import { createPendingConfirmation, resolveConfirmation } from "../../mcp/confirmation.js";
import { startDocsWarmup } from "../../mcp/docs.js";

/**
 * Thin Express adapter for the route-neutral Nexus backend module.
 *
 * The Nexus API key and chat history remain DappManager-owned DB concerns;
 * the proxy, context building, gateway client, and tool loop live in
 * @dappnode/nexus.
 */

const nexus = new NexusApi({
  apiKeyStore: {
    get: () => db.nexusApiKey.get(),
    set: (value) => db.nexusApiKey.set(value)
  },
  historyStore: {
    getAll: () => db.nexusChatHistory.getAll(),
    get: (id) => db.nexusChatHistory.get(id),
    set: (id, value) => db.nexusChatHistory.set(id, value),
    remove: (id) => db.nexusChatHistory.remove(id)
  },
  listPackages,
  logger: logs,
  mcp: {
    toolList: dappnodeToolList.map(({ name, displayName, mutating }) => ({ name, displayName, mutating })),
    getOpenAITools,
    dispatchTool,
    createPendingConfirmation,
    resolveConfirmation
  },
  getGatewayUrl: () => process.env.NEXUS_GATEWAY_URL,
  getDefaultModel: () => process.env.NEXUS_DEFAULT_MODEL,
  startDocsWarmup
});

/** GET /nexus/status - surfaces config for the UI. */
export const nexusStatus = wrapHandler(async (_req: Request, res: ExpressResponse) => {
  res.status(200).json(nexus.readStatus());
});

/** POST /nexus/config - validate and save the Nexus API key. */
export const nexusSetApiKey = wrapHandler(async (req: Request, res: ExpressResponse) => {
  try {
    res.status(200).json(await nexus.setApiKey((req.body as { apiKey?: unknown } | undefined)?.apiKey));
  } catch (err) {
    sendNexusError(res, err);
  }
});

/** DELETE /nexus/config - clear the stored Nexus API key. */
export const nexusClearApiKey = wrapHandler(async (_req: Request, res: ExpressResponse) => {
  res.status(200).json(nexus.clearApiKey());
});

/** GET /nexus/models - list chat-capable Nexus gateway models. */
export const nexusListModels = wrapHandler(async (_req: Request, res: ExpressResponse) => {
  try {
    res.status(200).json({ data: await nexus.listModels() });
  } catch (err) {
    sendNexusError(res, err);
  }
});

/** GET /nexus/chat/history - list conversations sorted newest first. */
export const nexusChatHistoryList = wrapHandler(async (_req: Request, res: ExpressResponse) => {
  res.status(200).json({ data: nexus.listHistory() });
});

/** GET /nexus/chat/history/:id - return a full conversation. */
export const nexusChatHistoryGet = wrapHandler(async (req: Request, res: ExpressResponse) => {
  try {
    res.status(200).json(nexus.getHistory(String(req.params.id || "")));
  } catch (err) {
    sendNexusError(res, err);
  }
});

/** PUT /nexus/chat/history/:id - upsert a conversation. */
export const nexusChatHistoryUpsert = wrapHandler(async (req: Request, res: ExpressResponse) => {
  try {
    res.status(200).json(nexus.upsertHistory(String(req.params.id || ""), req.body));
  } catch (err) {
    sendNexusError(res, err);
  }
});

/** DELETE /nexus/chat/history/:id - remove a conversation. */
export const nexusChatHistoryDelete = wrapHandler(async (req: Request, res: ExpressResponse) => {
  try {
    nexus.deleteHistory(String(req.params.id || ""));
    res.status(204).end();
  } catch (err) {
    sendNexusError(res, err);
  }
});

/** DELETE /nexus/chat/history - remove all conversations. */
export const nexusChatHistoryClear = wrapHandler(async (_req: Request, res: ExpressResponse) => {
  nexus.clearHistory();
  res.status(204).end();
});

/** POST /nexus/chat/confirm - resolve a pending mutating-tool confirmation. */
export const nexusChatConfirm = wrapHandler(async (req: Request, res: ExpressResponse) => {
  try {
    const result = nexus.resolveConfirmation(req.body);
    res.status(result.ok ? 200 : 404).json(result);
  } catch (err) {
    sendNexusError(res, err);
  }
});

/**
 * POST /nexus/chat/completions - OpenAI-compatible chat proxy. Streaming
 * responses are written through the route-neutral NexusStreamWriter contract.
 */
export const nexusChatCompletions = wrapHandler(async (req: Request, res: ExpressResponse) => {
  const ac = new AbortController();
  const onClose = () => ac.abort();
  req.on("close", onClose);

  try {
    const rawResponse = await nexus.chatCompletions(req.body, res, ac.signal);
    if (rawResponse && !res.writableEnded) {
      res.status(rawResponse.statusCode).type(rawResponse.contentType).send(rawResponse.body);
    }
  } catch (err) {
    sendNexusError(res, err);
  } finally {
    req.off("close", onClose);
    if (!res.writableEnded) res.end();
  }
});

function sendNexusError(res: ExpressResponse, err: unknown): never | void {
  if (!(err instanceof NexusApiError)) throw err;
  if (res.headersSent) return;

  if (err.rawBody !== undefined) {
    res
      .status(err.statusCode)
      .type(err.contentType || "application/json")
      .send(err.rawBody);
    return;
  }

  res.status(err.statusCode).json(err.payload ?? { error: { code: err.code, message: err.message } });
}
