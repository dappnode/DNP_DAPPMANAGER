import { JsonRpcProvider, FetchRequest } from "ethers";

type EndpointState = {
  url: string;
  provider: JsonRpcProvider;
  healthy: boolean; // last known health
  lastHealthyCheck: number; // epoch ms of last health probe (or failure)
  beaconchainUrl?: string;
  type: "local" | "remote";
};

// Removed: MultiProviderUrls. Each endpoint can have its own beaconchainUrl.

const ONE_MINUTE_MS = 60_000;

export class MultiUrlJsonRpcProvider extends JsonRpcProvider {
  private endpoints: EndpointState[];

  constructor(
    endpoints: Array<{ url: string; beaconchainUrl?: string; type: "local" | "remote" }>,
    customHeaders: Record<string, string> = {}
  ) {
    if (!endpoints || endpoints.length === 0) {
      throw new Error("MultiUrlJsonRpcProvider: at least one endpoint is required");
    }
    // Initialize the base JsonRpcProvider with the first endpoint
    super(endpoints[0].url, "mainnet", { staticNetwork: true });

    this.endpoints = endpoints.map((ep) => {
      const fetchRequest = new FetchRequest(ep.url);
      Object.entries(customHeaders).forEach(([header, value]) => {
        fetchRequest.setHeader(header, value);
      });
      return {
        url: ep.url,
        provider: new JsonRpcProvider(ep.url, "mainnet", { staticNetwork: true }),
        healthy: false,
        lastHealthyCheck: 0,
        beaconchainUrl: ep.beaconchainUrl,
        type: ep.type
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
          return await this.sendRequest(ep, now, errors, method, params);
        } catch (err) {
          console.warn(`Request to ${ep.url} failed: ${stringifyError(err)}`);
          continue;
        }
      }

      // Not healthy (or unknown). If checked < 1 minute ago, skip probing and move on.
      if (now - ep.lastHealthyCheck < ONE_MINUTE_MS) {
        console.log(`Skipping recently checked unhealthy endpoint ${ep.url}`);
        continue;
      }

      // Probe local full node health
      if (ep.type === "local") {
        // Probe beaconchain health if applicable
        if (ep.beaconchainUrl && !(await this.isBeaconHealthy(ep, errors))) continue;
        // Probe execution health
        if (!(await this.isExecutionHealthy(ep, errors))) continue;
      }

      // Healthy after probe — attempt the actual request.
      try {
        return await this.sendRequest(ep, now, errors, method, params);
      } catch (err) {
        console.warn(`Request to ${ep.url} failed after probe: ${stringifyError(err)}`);
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
   *
   */
  private async sendRequest(
    ep: EndpointState,
    now: number,
    errors: Array<{ url: string; error: unknown }>,
    method: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: Array<any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    try {
      const result = await ep.provider.send(method, params);
      return result;
    } catch (err) {
      ep.healthy = false;
      ep.lastHealthyCheck = now;
      errors.push({ url: ep.url, error: err });
      throw err;
    }
  }

  /**
   * Probe beaconchain health using /eth/v1/node/syncing endpoint
   */
  private async isBeaconHealthy(ep: EndpointState, errors: Array<{ url: string; error: unknown }>): Promise<boolean> {
    if (!ep.beaconchainUrl) return false; // No beaconchain to check
    try {
      const response = await fetch(`${ep.beaconchainUrl}/eth/v1/node/syncing`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      if (!data || !data.data || data.data.is_syncing) return false;
      return true;
    } catch (err) {
      ep.healthy = false;
      ep.lastHealthyCheck = Date.now();
      errors.push({ url: ep.beaconchainUrl, error: err });
      return false;
    }
  }

  /**
   * Runs `eth_syncing` on the endpoint:
   * - If result === false   => node is in sync -> mark healthy and return true
   * - If result === true or object OR throws => mark unhealthy and return false
   */
  private async isExecutionHealthy(
    ep: EndpointState,
    errors: Array<{ url: string; error: unknown }>
  ): Promise<boolean> {
    try {
      const res = await ep.provider.send("eth_syncing", []);
      const isHealthy = res === false;
      ep.healthy = isHealthy;
      ep.lastHealthyCheck = Date.now();
      return isHealthy;
    } catch (err) {
      ep.healthy = false;
      ep.lastHealthyCheck = Date.now();
      errors.push({ url: ep.url, error: err });
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
