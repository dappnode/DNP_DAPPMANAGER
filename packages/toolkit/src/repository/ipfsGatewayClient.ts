import { ContentLog, noopLog } from "./log.js";
import {
  RequestProfile,
  SMALL_REQUEST,
  TransportError,
  TransportPolicy,
  TransportPolicyOptions,
  toTransportError
} from "./transport.js";

export interface GatewayFetchOptions {
  /** Timeouts for this request. Defaults to SMALL_REQUEST. */
  profile?: RequestProfile;
  /** Overrides the profile's total timeout for each attempt. */
  timeoutMs?: number;
  /** Vetoes a same-gateway retry after a failed attempt. */
  shouldRetry?: (error: TransportError) => boolean;
}

/** Thrown when every gateway failed. Keeps the per-gateway errors for callers that need their kinds. */
export class AllGatewaysFailedError extends Error {
  readonly errors: TransportError[];

  constructor(failures: { gatewayUrl: string; error: TransportError }[]) {
    super(`All IPFS gateways failed (${failures.map((f) => `${f.gatewayUrl}: ${f.error.message}`).join("; ")})`);
    this.name = "AllGatewaysFailedError";
    this.errors = failures.map((f) => f.error);
  }
}

export class IpfsGatewayClient {
  private gatewayUrls: string[];
  private readonly log: ContentLog;
  readonly policy: TransportPolicy;

  constructor(
    gatewayUrls: string | string[],
    log: ContentLog = noopLog,
    policy: TransportPolicy | TransportPolicyOptions = {}
  ) {
    this.gatewayUrls = normalizeGatewayUrls(gatewayUrls);
    this.log = log;
    this.policy = policy instanceof TransportPolicy ? policy : new TransportPolicy(policy);
  }

  /** Replaces the configured gateways. Gateway health is kept, since it is keyed by URL. */
  public setGatewayUrls(gatewayUrls: string | string[]): void {
    this.gatewayUrls = normalizeGatewayUrls(gatewayUrls);
  }

  /** Configured gateways, healthy ones first in configured order, then those cooling down. */
  public orderedGatewayUrls(): string[] {
    return this.policy.orderEndpoints(this.gatewayUrls);
  }

  /**
   * Tries each gateway in health order. The response consumer runs inside the retry
   * boundary, so failures while reading or parsing a response are retried or fail over
   * to the next gateway. A caller abort stops immediately.
   */
  public async fetch<T>(
    ipfsPath: string,
    init: RequestInit,
    consume: (response: Response) => Promise<T>,
    options: GatewayFetchOptions = {}
  ): Promise<T> {
    const failures: { gatewayUrl: string; error: TransportError }[] = [];

    for (const gatewayUrl of this.orderedGatewayUrls()) {
      try {
        return await this.fetchFrom(gatewayUrl, ipfsPath, init, consume, options);
      } catch (e) {
        const error = toTransportError(e);
        if (error.kind === "aborted") throw error;
        failures.push({ gatewayUrl, error });
        this.log("warn", `IPFS gateway failed ${gatewayUrl}${ipfsPath}: ${error.message}`);
      }
    }

    throw new AllGatewaysFailedError(failures);
  }

  /** Requests a path from a single gateway, with same-gateway retries for transient failures. */
  public async fetchFrom<T>(
    gatewayUrl: string,
    ipfsPath: string | (() => string),
    init: RequestInit,
    consume: (response: Response) => Promise<T>,
    options: GatewayFetchOptions = {}
  ): Promise<T> {
    const baseProfile = options.profile ?? SMALL_REQUEST;
    const profile =
      options.timeoutMs === undefined ? baseProfile : { ...baseProfile, totalTimeoutMs: options.timeoutMs };
    const pathOf = (): string => (typeof ipfsPath === "string" ? ipfsPath : ipfsPath());
    let requestUrl = "";
    return this.policy.request({
      endpoint: gatewayUrl,
      url: () => (requestUrl = `${gatewayUrl}${pathOf()}`),
      init,
      consume,
      profile,
      shouldRetry: options.shouldRetry,
      hooks: {
        onAttempt: (attempt) =>
          // The URL is built right after this hook, so log the path that will be requested
          this.log(
            "debug",
            `Trying IPFS gateway ${gatewayUrl}${pathOf()}${attempt > 1 ? ` (attempt ${attempt})` : ""}`
          ),
        onRetry: (error, delayMs) =>
          this.log("warn", `IPFS gateway failed ${requestUrl}: ${error.message}; retrying in ${delayMs} ms`)
      }
    });
  }
}

/** @deprecated Use ContentLog, which is shared with the mirror provider. */
export type IpfsGatewayLog = ContentLog;

function normalizeGatewayUrls(gatewayUrls: string | string[]): string[] {
  const normalized = (Array.isArray(gatewayUrls) ? gatewayUrls : [gatewayUrls])
    .map((gatewayUrl) => gatewayUrl.trim().replace(/\/?$/, ""))
    .filter(Boolean);

  if (normalized.length === 0) throw new Error("At least one IPFS gateway is required");
  return normalized;
}
