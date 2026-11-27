/** Parses a JSON-RPC quantity, given as a hex string or a number. Null if it is neither */
export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value === "") return null;
  const parsed = value.startsWith("0x") ? parseInt(value, 16) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Percentage capped at 99, so a bar never reads 100% while the client is still syncing */
export function syncingPercent(done: number, total: number): number | null {
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return null;
  return Math.max(0, Math.min(99, Math.floor((done / total) * 100)));
}

const CONNECTION_ERROR_CODES = new Set(["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "EAI_AGAIN", "EHOSTUNREACH"]);

/** True if the request never reached a listening server, as while a client is still starting */
export function isConnectionError(e: unknown): boolean {
  const code = (e as { cause?: { code?: string } })?.cause?.code;
  return typeof code === "string" && CONNECTION_ERROR_CODES.has(code);
}

/** Fetches JSON, retrying once on a connection error: busy clients sometimes refuse a connection */
export async function fetchJson(url: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (e) {
    if (!isConnectionError(e)) throw e;
    await new Promise((resolve) => setTimeout(resolve, 300));
    response = await fetch(url, init);
  }
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  return response.json();
}

/** Fetches an optional resource. Null on any failure, so callers can fall back to what they have */
export async function fetchOptional<T>(fn: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T | null> {
  try {
    return await fn(AbortSignal.timeout(timeoutMs));
  } catch {
    return null;
  }
}
