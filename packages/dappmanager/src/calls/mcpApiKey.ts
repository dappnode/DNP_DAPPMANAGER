import * as db from "@dappnode/db";
import { getRandomAlphanumericToken } from "../api/auth/token.js";

const tokenLength = 64;

/**
 * Return the current in-app MCP API bearer key, or null if none has been
 * generated.
 */
export async function mcpApiKeyGet(): Promise<{ apiKey: string | null }> {
    const apiKey = db.mcpApiKey.get();
    return { apiKey: apiKey || null };
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
 * Remove the in-app MCP API bearer key. Bearer auth then falls back to the
 * `MCP_API_KEY` env var if configured; otherwise it is disabled.
 */
export async function mcpApiKeyRemove(): Promise<{ ok: true }> {
    db.mcpApiKey.set("");
    return { ok: true };
}
