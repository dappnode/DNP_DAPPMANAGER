import * as db from "@dappnode/db";
import { getRandomAlphanumericToken } from "../api/auth/token.js";
import { hashMcpApiKey, isHashedMcpApiKey } from "../api/auth/mcpApiKeyHash.js";

const tokenLength = 64;

/**
 * Return whether an in-app MCP API bearer key exists. The raw key is only
 * returned at generation time because the DB stores a one-way digest.
 */
export async function mcpApiKeyGet(): Promise<{ hasApiKey: boolean; mutatingToolsEnabled: boolean }> {
  const storedApiKey = db.mcpApiKey.get();

  return {
    hasApiKey: isHashedMcpApiKey(storedApiKey),
    mutatingToolsEnabled: db.mcpMutatingToolsEnabled.get()
  };
}

/**
 * Generate a new random MCP API bearer key, store its digest in the main DB and
 * return it to the caller. Any previous key is invalidated.
 */
export async function mcpApiKeyGenerate(): Promise<{ apiKey: string }> {
  const apiKey = getRandomAlphanumericToken(tokenLength);
  db.mcpApiKey.set(hashMcpApiKey(apiKey));
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
