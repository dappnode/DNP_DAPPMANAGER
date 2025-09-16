import { JsonRpcProvider, FetchRequest } from "ethers";

type EndpointState = {
  url: string;
  provider: JsonRpcProvider;
  healthy: boolean; // last known health
  lastHealthyCheck: number; // epoch ms of last health probe (or failure)
};

const ONE_MINUTE_MS = 60_000;

export class MultiUrlJsonRpcProvider extends JsonRpcProvider {
  private endpoints: EndpointState[];

  constructor(urls: string[], customHeaders: Record<string, string> = {}) {
    if (!urls || urls.length === 0) {
      throw new Error("MultiUrlJsonRpcProvider: at least one RPC URL is required");
    }
    // Initialize the base JsonRpcProvider with the first URL (won’t actually be used for routing).
    super(urls[0], "mainnet", { staticNetwork: true });

    this.endpoints = urls.map((url) => {
      const fetchRequest = new FetchRequest(url);
      Object.entries(customHeaders).forEach(([header, value]) => {
        fetchRequest.setHeader(header, value);
      });
      return {
        url,
        provider: new JsonRpcProvider(url, "mainnet", { staticNetwork: true }),
        healthy: false, // pessimistic default until checked
        lastHealthyCheck: 0
      };
    });
  }

  /**
   * Core hook: route every JSON-RPC call through the first eligible healthy endpoint.
   * If an endpoint is unhealthy and was checked < 1 min ago, skip it.
   * Otherwise, probe it with `eth_syncing`. If syncing === false, mark healthy and use it.
   * If syncing is true/object OR the probe errors, mark unhealthy (update timestamp) and try the next.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override async send(method: string, params: Array<any>): Promise<any> {
    const errors: Array<{ url: string; error: unknown }> = [];

    for (const ep of this.endpoints) {
      console.log(`Trying endpoint ${ep.url} (healthy: ${ep.healthy}) for method ${method}`);
      const now = Date.now();

      // Fast path: if we believe it's healthy, try the call immediately.
      if (ep.healthy) {
        console.log(`Endpoint ${ep.url} is healthy, trying request...`);
        try {
          const result = await ep.provider.send(method, params);
          console.log(`Request to ${ep.url} succeeded.`);
          return result;
        } catch (err) {
          console.warn(`Request to ${ep.url} failed: ${stringifyError(err)}`);
          // Mark unhealthy and record a timestamp, then fall through to try others.
          ep.healthy = false;
          ep.lastHealthyCheck = now;
          errors.push({ url: ep.url, error: err });
          continue;
        }
      }

      // Not healthy (or unknown). If checked < 1 minute ago, skip probing and move on.
      if (now - ep.lastHealthyCheck < ONE_MINUTE_MS) {
        console.log(`Skipping recently checked unhealthy endpoint ${ep.url}`);
        continue;
      }

      // Probe health with eth_syncing.
      const healthyNow = await this.probeHealth(ep).catch((err) => {
        ep.healthy = false;
        ep.lastHealthyCheck = now;
        errors.push({ url: ep.url, error: err });
        return false;
      });

      if (!healthyNow) {
        console.log(`Endpoint ${ep.url} is unhealthy after probe.`);
        // Unhealthy; try next endpoint.
        continue;
      }

      // Healthy after probe — attempt the actual request.
      try {
        const result = await ep.provider.send(method, params);
        console.log(`Request to ${ep.url} succeeded after probe.`);
        return result;
      } catch (err) {
        console.warn(`Request to ${ep.url} failed after probe: ${stringifyError(err)}`);
        // Call failed; downgrade this endpoint and try the next.
        ep.healthy = false;
        ep.lastHealthyCheck = Date.now();
        errors.push({ url: ep.url, error: err });
        continue;
      }
    }

    // If we reach here, all endpoints failed or were ineligible.
    const err = new Error(
      `MultiUrlJsonRpcProvider: all RPC endpoints failed for method "${method}".` +
        (errors.length ? ` Last errors: ${errors.map((e) => `\n- ${e.url}: ${stringifyError(e.error)}`).join("")}` : "")
    );
    console.log(err.message);
    throw err;
  }

  /**
   * Runs `eth_syncing` on the endpoint:
   * - If result === false   => node is in sync -> mark healthy and return true
   * - If result === true or object OR throws => mark unhealthy and return false
   */
  private async probeHealth(ep: EndpointState): Promise<boolean> {
    try {
      const res = await ep.provider.send("eth_syncing", []);
      const isHealthy = res === false;
      ep.healthy = isHealthy;
      ep.lastHealthyCheck = Date.now();
      return isHealthy;
    } catch (err) {
      ep.healthy = false;
      ep.lastHealthyCheck = Date.now();
      return false;
    }
  }

  /**
   * Optional: expose current endpoint states (read-only copies).
   */
  public getEndpointStates(): Array<Pick<EndpointState, "url" | "healthy" | "lastHealthyCheck">> {
    return this.endpoints.map(({ url, healthy, lastHealthyCheck }) => ({
      url,
      healthy,
      lastHealthyCheck
    }));
  }
}

function stringifyError(e: unknown): string {
  if (e instanceof Error) return `${e.name}: ${e.message}`;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
