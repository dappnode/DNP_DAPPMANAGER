import { expect } from "chai";
import { IpfsGatewayClient } from "../../src/repository/ipfsGatewayClient.js";

describe("IpfsGatewayClient", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("tries gateways in order until one succeeds", async () => {
    const requestedUrls: string[] = [];
    globalThis.fetch = async (input) => {
      requestedUrls.push(input.toString());
      return requestedUrls.length === 1
        ? new Response("unavailable", { status: 503 })
        : new Response('{"ok":true}', { status: 200 });
    };

    const client = new IpfsGatewayClient(["https://first.example/", "https://second.example"]);
    const result = await client.fetch("/ipfs/cid", {}, async (response) => response.json());

    expect(result).to.deep.equal({ ok: true });
    expect(requestedUrls).to.deep.equal(["https://first.example/ipfs/cid", "https://second.example/ipfs/cid"]);
  });

  it("tries the next gateway when consuming a successful response fails", async () => {
    let requestCount = 0;
    globalThis.fetch = async () => {
      requestCount += 1;
      return new Response(requestCount === 1 ? "invalid json" : '{"ok":true}', { status: 200 });
    };

    const client = new IpfsGatewayClient(["https://first.example", "https://second.example"]);
    const result = await client.fetch("/ipfs/cid", {}, async (response) => response.json());

    expect(result).to.deep.equal({ ok: true });
    expect(requestCount).to.equal(2);
  });

  it("reports every gateway error when all attempts fail", async () => {
    globalThis.fetch = async () => new Response("unavailable", { status: 502, statusText: "Bad Gateway" });
    const client = new IpfsGatewayClient(["https://first.example", "https://second.example"]);

    try {
      await client.fetch("/ipfs/cid", {}, async (response) => response.text());
      expect.fail("Expected the request to fail");
    } catch (error) {
      expect((error as Error).message).to.include("https://first.example: 502 Bad Gateway");
      expect((error as Error).message).to.include("https://second.example: 502 Bad Gateway");
    }
  });
});
