import { randomUUID } from "crypto";
import type { Request, Response as ExpressResponse } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { logs } from "@dappnode/logger";
import { dappnodeToolList } from "./tools.js";

/**
 * Single-session MCP server for this DAppNode. Mounted at `/mcp` behind
 * `auth.onlyAdmin`. The same tool registry is used by the embedded chat
 * proxy via in-process dispatch (see ./dispatch.ts), so behaviour is
 * identical between internal chat and external MCP clients.
 */

let connectPromise: Promise<void> | null = null;
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID()
});

function buildServer(): McpServer {
  const server = new McpServer({
    name: "dappnode",
    version: "0.1.0"
  });

  for (const tool of dappnodeToolList) {
    server.tool(tool.name, tool.description, tool.schema, async (input: unknown) => {
      try {
        const output = await tool.execute(input || {});
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }]
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logs.warn(`MCP tool ${tool.name} failed: ${message}`);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${message}` }]
        };
      }
    });
  }

  return server;
}

function ensureConnected(): Promise<void> {
  if (!connectPromise) {
    const server = buildServer();
    connectPromise = server.connect(transport).catch((err) => {
      logs.error(`MCP server failed to connect transport: ${err instanceof Error ? err.message : err}`);
      connectPromise = null;
      throw err;
    });
  }
  return connectPromise;
}

/**
 * Express handler for `/mcp` (GET / POST / DELETE). The streamable HTTP
 * transport handles MCP protocol framing; we just pass `req`/`res` through.
 */
export async function handleMcpRequest(req: Request, res: ExpressResponse): Promise<void> {
  await ensureConnected();
  // The SDK's `handleRequest` accepts the parsed body for POST. For other
  // verbs (GET / DELETE — used for session lifecycle and SSE listening) the
  // body argument is ignored.
  const body = req.method === "POST" ? req.body : undefined;
  await transport.handleRequest(req, res, body);
}
