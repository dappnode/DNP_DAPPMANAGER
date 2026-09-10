import { randomUUID } from "crypto";
import { logs } from "@dappnode/logger";

/**
 * Cross-request store of in-flight tool-call confirmations. When the chat
 * proxy is about to dispatch a mutating tool it creates a pending entry,
 * surfaces the prompt to the browser over the open SSE stream, and awaits
 * the user's decision (delivered out-of-band via `POST /nexus/chat/confirm`).
 */

export type ConfirmationDecision = "approve" | "deny";

export interface ConfirmationResult {
  decision: ConfirmationDecision;
  reason?: string;
}

interface PendingEntry {
  id: string;
  tool: string;
  args: unknown;
  createdAt: number;
  resolve: (result: ConfirmationResult) => void;
  timer: ReturnType<typeof setTimeout>;
}

const pending = new Map<string, PendingEntry>();

/** How long to wait before auto-denying a confirmation (no user response). */
const CONFIRMATION_TIMEOUT_MS = 5 * 60 * 1000;

export interface CreatedConfirmation {
  id: string;
  promise: Promise<ConfirmationResult>;
}

/**
 * Create a pending confirmation. The caller is responsible for surfacing the
 * `id` (along with tool name + args) to the user, then awaiting `promise`.
 *
 * If `signal` is provided, an abort on it immediately resolves the promise
 * with `decision: "deny"` and tears the entry down — so a closed SSE
 * connection cleans up cleanly.
 */
export function createPendingConfirmation(
  tool: string,
  args: unknown,
  signal?: AbortSignal
): CreatedConfirmation {
  const id = randomUUID();

  if (signal?.aborted) {
    return { id, promise: Promise.resolve({ decision: "deny", reason: "aborted" }) };
  }

  let resolveOuter: (result: ConfirmationResult) => void;
  const promise = new Promise<ConfirmationResult>((resolve) => {
    resolveOuter = resolve;
  });

  const timer = setTimeout(() => {
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    logs.warn(`MCP confirmation ${id} (${tool}) timed out — auto-denying`);
    entry.resolve({ decision: "deny", reason: "timeout" });
  }, CONFIRMATION_TIMEOUT_MS);

  const entry: PendingEntry = {
    id,
    tool,
    args,
    createdAt: Date.now(),
    resolve: (result) => {
      clearTimeout(timer);
      pending.delete(id);
      resolveOuter(result);
    },
    timer
  };
  pending.set(id, entry);

  if (signal) {
    const onAbort = () => entry.resolve({ decision: "deny", reason: "aborted" });
    signal.addEventListener("abort", onAbort, { once: true });
  }

  return { id, promise };
}

/**
 * Resolve a confirmation from the UI's POST callback. Returns false if the
 * id is unknown (already resolved or never existed).
 */
export function resolveConfirmation(
  id: string,
  decision: ConfirmationDecision,
  reason?: string
): boolean {
  const entry = pending.get(id);
  if (!entry) return false;
  entry.resolve({ decision, reason });
  return true;
}
