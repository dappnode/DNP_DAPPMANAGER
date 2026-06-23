import * as db from "@dappnode/db";
import { getRandomAlphanumericToken } from "../api/auth/token.js";

const tokenLength = 64;

/**
 * Return the current in-app MCP API bearer key, or null if none has been
 * generated.
 */
export async function mcpApiKeyGet(): Promise<{ apiKey: string | null; mutatingToolsEnabled: boolean }> {
  const apiKey = db.mcpApiKey.get();
  return {
    apiKey: apiKey || null,
    mutatingToolsEnabled: db.mcpMutatingToolsEnabled.get()
  };
}

/**
 * Generate a new random MCP API bearer key, store it in the main DB and
 * return it to the caller. Any previous key is invalidated.
 */
export async function mcpApiKeyGenerate(): Promise<{ apiKey: string }> {
  const apiKey = getRandomAlphanumericToken(tokenLength);
  db.mcpApiKey.set(apiKey);
  return { apiKey };
}

/**
 * Remove the in-app MCP API bearer key. Bearer auth is disabled until the
 * admin generates a new key.
 */
export async function mcpApiKeyRemove(): Promise<{ ok: true }> {
  db.mcpApiKey.set("");
  return { ok: true };
}

/**
 * Enable or disable mutating tools for external MCP clients.
 */
export async function mcpMutatingToolsSet({ enabled }: { enabled: boolean }): Promise<{ enabled: boolean }> {
  db.mcpMutatingToolsEnabled.set(enabled);
  return { enabled };
}
