export class IpfsGatewayClient {
  private gatewayUrls: string[];
  private readonly log: IpfsGatewayLog;

  constructor(gatewayUrls: string | string[], log: IpfsGatewayLog = () => undefined) {
    this.gatewayUrls = normalizeGatewayUrls(gatewayUrls);
    this.log = log;
  }

  public setGatewayUrls(gatewayUrls: string | string[]): void {
    this.gatewayUrls = normalizeGatewayUrls(gatewayUrls);
  }

  /**
   * Tries each gateway in order. The response consumer runs inside the retry
   * boundary, so failures while reading or parsing a response also try the next
   * gateway.
   */
  public async fetch<T>(
    ipfsPath: string,
    init: RequestInit,
    consume: (response: Response) => Promise<T>,
    options: { timeoutMs?: number } = {}
  ): Promise<T> {
    const errors: string[] = [];

    for (const gatewayUrl of this.gatewayUrls) {
      const requestUrl = `${gatewayUrl}${ipfsPath}`;
      const controller = new AbortController();
      const callerSignal = init.signal;
      let timedOut = false;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const abortFromCaller = (): void => controller.abort(callerSignal?.reason);
      if (callerSignal?.aborted) abortFromCaller();
      else callerSignal?.addEventListener("abort", abortFromCaller, { once: true });

      if (options.timeoutMs !== undefined) {
        timeoutId = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, options.timeoutMs);
      }

      try {
        this.log("info", `Trying IPFS gateway ${requestUrl}`);
        const response = await fetch(requestUrl, { ...init, signal: controller.signal });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return await consume(response);
      } catch (error) {
        if (callerSignal?.aborted) throw error;
        const message = timedOut
          ? `timed out after ${options.timeoutMs} ms`
          : error instanceof Error
            ? error.message
            : String(error);
        errors.push(`${gatewayUrl}: ${message}`);
        this.log("warn", `IPFS gateway failed ${requestUrl}: ${message}`);
      } finally {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        callerSignal?.removeEventListener("abort", abortFromCaller);
      }
    }

    throw new Error(`All IPFS gateways failed (${errors.join("; ")})`);
  }
}

export type IpfsGatewayLog = (level: "info" | "warn", message: string) => void;

function normalizeGatewayUrls(gatewayUrls: string | string[]): string[] {
  const normalized = (Array.isArray(gatewayUrls) ? gatewayUrls : [gatewayUrls])
    .map((gatewayUrl) => gatewayUrl.trim().replace(/\/?$/, ""))
    .filter(Boolean);

  if (normalized.length === 0) throw new Error("At least one IPFS gateway is required");
  return normalized;
}
