import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { logs } from "@dappnode/logger";
import { dappnodeTools, dappnodeToolList, type DappnodeTool } from "./tools.js";

/**
 * In-process tool dispatcher used by the chat proxy. The MCP server (see
 * ./server.ts) exposes the same registry over HTTP for external clients;
 * this module skips the protocol overhead for the embedded chat.
 */

export interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/** Converts a tool's Zod schema to the OpenAI function-calling format. */
export function toOpenAIFormat(tool: DappnodeTool): OpenAITool {
  const objectSchema = z.object(tool.schema);
  const jsonSchema = zodToJsonSchema(objectSchema, {
    $refStrategy: "none",
    target: "openApi3"
  }) as Record<string, unknown>;
  // OpenAI tolerates plain JSON Schema; strip any top-level $schema.
  delete jsonSchema.$schema;
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: jsonSchema
    }
  };
}

/** Full tool catalogue in OpenAI format, ready to drop into `tools: [...]`. */
export function getOpenAITools(): OpenAITool[] {
  return dappnodeToolList.map(toOpenAIFormat);
}

export interface ToolDispatchResult {
  ok: boolean;
  output?: unknown;
  error?: string;
  mutating?: boolean;
}

/** Looks up the tool by name, validates its args, and runs `execute()`. */
export async function dispatchTool(
  name: string,
  rawArgs: unknown
): Promise<ToolDispatchResult> {
  const tool = dappnodeTools[name];
  if (!tool) return { ok: false, error: `Unknown tool: ${name}` };

  const args = rawArgs && typeof rawArgs === "object" ? rawArgs : {};

  // Validate args against the tool's Zod schema (best-effort — let the
  // model see validation errors so it can retry).
  const validation = z.object(tool.schema).safeParse(args);
  if (!validation.success) {
    return {
      ok: false,
      error: `Invalid arguments for ${name}: ${validation.error.message}`,
      mutating: tool.mutating
    };
  }

  try {
    const output = await tool.execute(validation.data);
    return { ok: true, output, mutating: tool.mutating };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logs.warn(`Tool dispatch ${name} failed: ${message}`);
    return { ok: false, error: message, mutating: tool.mutating };
  }
}
