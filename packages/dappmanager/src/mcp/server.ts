import type { Request, Response as ExpressResponse } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";
import { dappnodeToolList, toolAnnotations, type DappnodeTool } from "./tools.js";

/**
 * Stateless MCP server for this DAppNode.
 *
 * A fresh McpServer + StreamableHTTPServerTransport is created for every
 * request. This prevents stale sessions from a previous agent run from
 * holding the transport/session lock and blocking new requests.
 *
 * The same tool registry is used by the embedded chat proxy via in-process
 * dispatch (see ./dispatch.ts), so behaviour is identical between internal
 * chat and external MCP clients.
 */

function mcpMutationsEnabled(): boolean {
  return db.mcpMutatingToolsEnabled.get();
}

function shouldExposeToolToMcp(tool: DappnodeTool): boolean {
  return !tool.mutating || mcpMutationsEnabled();
}

function buildServer(): McpServer {
  const server = new McpServer({
    name: "dappnode",
    version: "0.1.0"
  });

  for (const tool of dappnodeToolList.filter(shouldExposeToolToMcp)) {
    server.tool(tool.name, tool.description, tool.schema, toolAnnotations(tool), async (input: unknown) => {
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

/**
 * Express handler for `/mcp`.
 *
 * Only POST is supported in stateless mode. GET / DELETE (used in stateful
 * mode for SSE session lifecycle) return 405.
 */
export async function handleMcpRequest(req: Request, res: ExpressResponse): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed. This DAppNode MCP endpoint is stateless; only POST is supported."
      },
      id: null
    });
    return;
  }

  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  // Register cleanup before handling the request so a very fast/synchronous
  // response still triggers transport/server teardown. This prevents leaked
  // timers and SSE connections when multiple MCP consumers hit /mcp
  // concurrently.
  res.on("close", () => {
    transport.close().catch((err) => {
      logs.warn(`MCP transport close error: ${err instanceof Error ? err.message : String(err)}`);
    });
    server.close().catch((err) => {
      logs.warn(`MCP server close error: ${err instanceof Error ? err.message : String(err)}`);
    });
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
