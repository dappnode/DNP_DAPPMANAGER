import { errorMessage } from "./log.js";

/**
 * Shared transport policy for content downloads (IPFS gateways and the HTTP mirror):
 * timeouts, same-endpoint retries with backoff, endpoint health memory and a per-host
 * concurrency limit.
 */

export type TransportErrorKind = "timeout" | "stall" | "http" | "network" | "integrity" | "too_large" | "aborted";

export class TransportError extends Error {
  readonly kind: TransportErrorKind;
  /** HTTP status, for kind "http" */
  readonly status?: number;
  /** Parsed Retry-After header, for kind "http" */
  readonly retryAfterMs?: number;

  constructor(
    kind: TransportErrorKind,
    message: string,
    options: { status?: number; retryAfterMs?: number; cause?: unknown } = {}
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "TransportError";
    this.kind = kind;
    this.status = options.status;
    this.retryAfterMs = options.retryAfterMs;
  }
}

/**
 * Normalises any error to a TransportError. Errors thrown by a response consumer that are not
 * transport errors mean the content could not be parsed or verified, so they are integrity errors.
 */
export function toTransportError(error: unknown): TransportError {
  if (error instanceof TransportError) return error;
  return new TransportError("integrity", errorMessage(error), { cause: error });
}

export interface RequestProfile {
  /** Time to response headers. Defaults to the policy's headersTimeoutMs. */
  headersTimeoutMs?: number;
  /** Maximum time without receiving a body chunk. Reset on every chunk. */
  stallTimeoutMs: number;
  /** Cap on the whole attempt, including consuming the body. No cap if undefined. */
  totalTimeoutMs?: number;
}

/** Directory listings, manifests and other small files. */
export const SMALL_REQUEST: RequestProfile = { stallTimeoutMs: 30 * 1000, totalTimeoutMs: 60 * 1000 };
/** Docker images and other large files: no total cap, only stall detection. */
export const LARGE_REQUEST: RequestProfile = { stallTimeoutMs: 60 * 1000 };

export const DEFAULT_HEADERS_TIMEOUT_MS = 30 * 1000;
const MAX_ATTEMPTS_PER_ENDPOINT = 2;
const BACKOFF_BASE_MS = 500;
const BACKOFF_CAP_MS = 5 * 1000;
const MAX_RETRY_AFTER_MS = 10 * 1000;
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const MAX_CONCURRENT_PER_HOST = 6;
const FAILURES_BEFORE_COOLDOWN = 3;
const COOLDOWN_BASE_MS = 60 * 1000;
const COOLDOWN_CAP_MS = 10 * 60 * 1000;

export interface TransportPolicyOptions {
  /** Time to response headers. Default 30 s. */
  headersTimeoutMs?: number;
  maxConcurrentPerHost?: number;
  /** Injectable delay, so tests do not wait for real backoff. */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  /** Injectable randomness for backoff jitter, in [0, 1). */
  random?: () => number;
  /** Injectable clock for endpoint cooldowns. */
  now?: () => number;
}

export interface RequestHooks {
  /** Called before each attempt, numbered from 1. */
  onAttempt?: (attempt: number) => void;
  /** Called when a failed attempt will be retried on the same endpoint after delayMs. */
  onRetry?: (error: TransportError, delayMs: number) => void;
}

export interface TransportRequest<T> {
  /** Health is tracked per endpoint, e.g. the gateway base URL. */
  endpoint: string;
  url: string | (() => string);
  init?: RequestInit;
  /** Reads the response. Runs inside the retry boundary, so its failures are retried or fail over. */
  consume: (response: Response) => Promise<T>;
  profile: RequestProfile;
  hooks?: RequestHooks;
  /** Vetoes a same-endpoint retry, e.g. when the caller can resume more cheaply than repeating the request. */
  shouldRetry?: (error: TransportError) => boolean;
}

export class TransportPolicy {
  readonly headersTimeoutMs: number;
  private readonly maxConcurrentPerHost: number;
  /** Waits for the given time. Injectable, so tests do not wait for real delays. */
  readonly sleep: (ms: number, signal?: AbortSignal) => Promise<void>;
  private readonly random: () => number;
  private readonly health: EndpointHealth;
  private readonly semaphores = new Map<string, Semaphore>();

  constructor(options: TransportPolicyOptions = {}) {
    this.headersTimeoutMs = options.headersTimeoutMs ?? DEFAULT_HEADERS_TIMEOUT_MS;
    this.maxConcurrentPerHost = options.maxConcurrentPerHost ?? MAX_CONCURRENT_PER_HOST;
    this.sleep = options.sleep ?? abortableSleep;
    this.random = options.random ?? Math.random;
    this.health = new EndpointHealth(options.now ?? Date.now);
  }

  /** Healthy endpoints in the given order, then endpoints cooling down as a last resort. */
  orderEndpoints(endpoints: string[]): string[] {
    return this.health.order(endpoints);
  }

  isCoolingDown(endpoint: string): boolean {
    return this.health.isCoolingDown(endpoint);
  }

  /**
   * Requests a URL from one endpoint, retrying transient failures on the same endpoint.
   * Records the final outcome in the endpoint's health. A caller abort is never retried.
   */
  async request<T>({
    endpoint,
    url,
    init = {},
    consume,
    profile,
    hooks,
    shouldRetry
  }: TransportRequest<T>): Promise<T> {
    let lastError: TransportError | undefined;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_ENDPOINT; attempt++) {
      hooks?.onAttempt?.(attempt);
      try {
        const result = await this.attempt(typeof url === "string" ? url : url(), init, consume, profile);
        this.health.success(endpoint);
        return result;
      } catch (e) {
        const error = toTransportError(e);
        if (error.kind === "aborted") throw error;
        lastError = error;
        const mayRetry = attempt < MAX_ATTEMPTS_PER_ENDPOINT && (shouldRetry?.(error) ?? true);
        const delay = mayRetry ? this.retryDelay(error, attempt) : undefined;
        if (delay === undefined) break;
        hooks?.onRetry?.(error, delay);
        try {
          await this.sleep(delay, init.signal ?? undefined);
        } catch (sleepError) {
          throw new TransportError("aborted", "Request aborted", { cause: sleepError });
        }
        if (init.signal?.aborted) throw new TransportError("aborted", "Request aborted");
      }
    }
    if (lastError && countsAgainstHealth(lastError)) this.health.failure(endpoint);
    throw lastError ?? new TransportError("network", "Request failed");
  }

  /** Delay before retrying on the same endpoint, or undefined to move on to the next endpoint. */
  private retryDelay(error: TransportError, attempt: number): number | undefined {
    if (error.kind === "network") return this.backoff(attempt);
    if (error.kind === "http" && error.status !== undefined && RETRYABLE_STATUS.has(error.status)) {
      if (error.retryAfterMs !== undefined) {
        return error.retryAfterMs <= MAX_RETRY_AFTER_MS ? error.retryAfterMs : undefined;
      }
      return this.backoff(attempt);
    }
    return undefined;
  }

  /** Exponential backoff with full jitter. */
  private backoff(attempt: number): number {
    const ceiling = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** (attempt - 1));
    return Math.round(this.random() * ceiling);
  }

  private semaphoreFor(url: string): Semaphore {
    const host = new URL(url).host;
    let semaphore = this.semaphores.get(host);
    if (!semaphore) {
      semaphore = new Semaphore(this.maxConcurrentPerHost);
      this.semaphores.set(host, semaphore);
    }
    return semaphore;
  }

  /** A single HTTP attempt with header, stall and total timeouts. */
  private async attempt<T>(
    url: string,
    init: RequestInit,
    consume: (response: Response) => Promise<T>,
    profile: RequestProfile
  ): Promise<T> {
    const callerSignal = init.signal ?? undefined;
    if (callerSignal?.aborted) throw new TransportError("aborted", "Request aborted");

    let release: () => void;
    try {
      release = await this.semaphoreFor(url).acquire(callerSignal);
    } catch (e) {
      throw new TransportError("aborted", "Request aborted", { cause: e });
    }

    const controller = new AbortController();
    let failure: TransportError | undefined;
    const fail = (error: TransportError): void => {
      if (failure) return;
      failure = error;
      controller.abort(error);
    };
    const onCallerAbort = (): void => fail(new TransportError("aborted", "Request aborted"));
    callerSignal?.addEventListener("abort", onCallerAbort, { once: true });

    // Rejects as soon as the attempt fails for any reason, so pending reads never hang.
    const aborted = new Promise<never>((_resolve, reject) => {
      controller.signal.addEventListener("abort", () => reject(failure), { once: true });
    });
    aborted.catch(() => undefined);

    const headersTimeoutMs = profile.headersTimeoutMs ?? this.headersTimeoutMs;
    const headersTimer = setTimeout(
      () => fail(new TransportError("timeout", `timed out after ${headersTimeoutMs} ms waiting for response headers`)),
      headersTimeoutMs
    );
    const { totalTimeoutMs } = profile;
    const totalTimer =
      totalTimeoutMs === undefined
        ? undefined
        : setTimeout(() => fail(new TransportError("timeout", `timed out after ${totalTimeoutMs} ms`)), totalTimeoutMs);

    try {
      let response: Response;
      try {
        response = await Promise.race([fetch(url, { ...init, signal: controller.signal }), aborted]);
      } catch (e) {
        throw failure ?? new TransportError("network", describeNetworkError(e), { cause: e });
      } finally {
        clearTimeout(headersTimer);
      }

      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);
        throw new TransportError("http", `${response.status} ${response.statusText}`.trim(), {
          status: response.status,
          retryAfterMs: parseRetryAfter(response.headers.get("retry-after"))
        });
      }

      const watched = watchBody(response, profile.stallTimeoutMs, fail, aborted, () => failure);
      try {
        return await consume(watched);
      } catch (e) {
        throw failure ?? toTransportError(e);
      }
    } finally {
      clearTimeout(headersTimer);
      if (totalTimer !== undefined) clearTimeout(totalTimer);
      callerSignal?.removeEventListener("abort", onCallerAbort);
      // Release network resources if the consumer stopped early or the attempt failed.
      if (!controller.signal.aborted) controller.abort(new TransportError("aborted", "Request finished"));
      release();
    }
  }
}

/**
 * Wraps the response body so that every read must deliver a chunk within stallTimeoutMs,
 * and so that read errors are reported as network errors (or as the failure that aborted the attempt).
 */
function watchBody(
  response: Response,
  stallTimeoutMs: number,
  fail: (error: TransportError) => void,
  aborted: Promise<never>,
  currentFailure: () => TransportError | undefined
): Response {
  if (!response.body || response.status === 204 || response.status === 205) return response;
  const reader = response.body.getReader();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const timer = setTimeout(
        () => fail(new TransportError("stall", `stalled: no data received for ${stallTimeoutMs} ms`)),
        stallTimeoutMs
      );
      try {
        const { done, value } = await Promise.race([reader.read(), aborted]);
        if (done) controller.close();
        else controller.enqueue(value);
      } catch (e) {
        reader.cancel().catch(() => undefined);
        controller.error(currentFailure() ?? new TransportError("network", describeNetworkError(e), { cause: e }));
      } finally {
        clearTimeout(timer);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    }
  });
  return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
}

function describeNetworkError(error: unknown): string {
  const message = errorMessage(error);
  const cause = error instanceof Error ? (error.cause as { code?: string; message?: string } | undefined) : undefined;
  const detail = cause?.code ?? cause?.message;
  return detail && !message.includes(detail) ? `${message} (${detail})` : message;
}

/** Errors that say something about the endpoint rather than about the requested content. */
function countsAgainstHealth(error: TransportError): boolean {
  switch (error.kind) {
    case "timeout":
    case "stall":
    case "network":
    case "integrity":
      return true;
    case "http":
      return error.status !== undefined && RETRYABLE_STATUS.has(error.status);
    default:
      return false;
  }
}

/** Parses a Retry-After header (delta seconds or HTTP date) into milliseconds. */
export function parseRetryAfter(value: string | null, now: number = Date.now()): number | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;
  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, date - now);
}

function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Remembers recent failures per endpoint. After FAILURES_BEFORE_COOLDOWN consecutive failures an
 * endpoint cools down for 60 s, doubling on every further failure up to 10 min. A success resets it.
 * Endpoints cooling down are ordered last but never skipped.
 */
class EndpointHealth {
  private readonly state = new Map<string, { failures: number; cooldownMs: number; until: number }>();

  constructor(private readonly now: () => number) {}

  success(endpoint: string): void {
    this.state.delete(endpoint);
  }

  failure(endpoint: string): void {
    const state = this.state.get(endpoint) ?? { failures: 0, cooldownMs: 0, until: 0 };
    state.failures += 1;
    if (state.failures >= FAILURES_BEFORE_COOLDOWN) {
      state.cooldownMs = state.cooldownMs === 0 ? COOLDOWN_BASE_MS : Math.min(state.cooldownMs * 2, COOLDOWN_CAP_MS);
      state.until = this.now() + state.cooldownMs;
    }
    this.state.set(endpoint, state);
  }

  isCoolingDown(endpoint: string): boolean {
    const state = this.state.get(endpoint);
    return state !== undefined && state.until > this.now();
  }

  order(endpoints: string[]): string[] {
    const healthy = endpoints.filter((endpoint) => !this.isCoolingDown(endpoint));
    const coolingDown = endpoints.filter((endpoint) => this.isCoolingDown(endpoint));
    return [...healthy, ...coolingDown];
  }
}

/** Counting semaphore with abortable waits. */
export class Semaphore {
  private available: number;
  private readonly waiters: (() => void)[] = [];

  constructor(permits: number) {
    this.available = permits;
  }

  async acquire(signal?: AbortSignal): Promise<() => void> {
    if (this.available > 0) {
      this.available -= 1;
      return this.releaser();
    }
    await new Promise<void>((resolve, reject) => {
      const onAbort = (): void => {
        const index = this.waiters.indexOf(grant);
        if (index >= 0) this.waiters.splice(index, 1);
        reject(signal?.reason);
      };
      const grant = (): void => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      };
      if (signal?.aborted) return reject(signal.reason);
      signal?.addEventListener("abort", onAbort, { once: true });
      this.waiters.push(grant);
    });
    return this.releaser();
  }

  private releaser(): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = this.waiters.shift();
      if (next) next();
      else this.available += 1;
    };
  }
}
