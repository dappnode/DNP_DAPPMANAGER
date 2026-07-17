export class IpfsGatewayClient {
  private gatewayUrls: string[];

  constructor(gatewayUrls: string | string[]) {
    this.gatewayUrls = normalizeGatewayUrls(gatewayUrls);
  }

  public setGatewayUrls(gatewayUrls: string | string[]): void {
    this.gatewayUrls = normalizeGatewayUrls(gatewayUrls);
  }

  /**
   * Tries each gateway in order. The response consumer runs inside the retry
   * boundary, so failures while reading or parsing a response also try the next
   * gateway.
   */
  public async fetch<T>(ipfsPath: string, init: RequestInit, consume: (response: Response) => Promise<T>): Promise<T> {
    const errors: string[] = [];

    for (const gatewayUrl of this.gatewayUrls) {
      try {
        const response = await fetch(`${gatewayUrl}${ipfsPath}`, init);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return await consume(response);
      } catch (error) {
        errors.push(`${gatewayUrl}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    throw new Error(`All IPFS gateways failed (${errors.join("; ")})`);
  }
}

function normalizeGatewayUrls(gatewayUrls: string | string[]): string[] {
  const normalized = (Array.isArray(gatewayUrls) ? gatewayUrls : [gatewayUrls])
    .map((gatewayUrl) => gatewayUrl.trim().replace(/\/?$/, ""))
    .filter(Boolean);

  if (normalized.length === 0) throw new Error("At least one IPFS gateway is required");
  return normalized;
}
