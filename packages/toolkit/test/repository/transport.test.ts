import { expect } from "chai";
import { IpfsGatewayClient } from "../../src/repository/ipfsGatewayClient.js";
import { TransportError, TransportPolicy, parseRetryAfter } from "../../src/repository/transport.js";

const FIRST = "https://first.example";
const SECOND = "https://second.example";

function client(options: { sleeps?: number[]; now?: () => number } = {}): IpfsGatewayClient {
  return new IpfsGatewayClient([FIRST, SECOND], undefined, {
    sleep: async (ms) => {
      options.sleeps?.push(ms);
    },
    random: () => 1,
    now: options.now
  });
}

/** A 200 response whose body sends one chunk and then never sends more. */
function stalledResponse(): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"ok":'));
      }
    })
  );
}

describe("Transport policy", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fails over to the next gateway when the response body stalls", async () => {
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      requests.push(input.toString());
      return input.toString().startsWith(FIRST) ? stalledResponse() : new Response('{"ok":true}');
    };

    const result = await client().fetch("/ipfs/cid", {}, (res) => res.json(), {
      profile: { stallTimeoutMs: 20 }
    });

    expect(result).to.deep.equal({ ok: true });
    // A stall is not retried on the same gateway
    expect(requests).to.deep.equal([`${FIRST}/ipfs/cid`, `${SECOND}/ipfs/cid`]);
  });

  it("reports a stall with its own error kind", async () => {
    globalThis.fetch = async () => stalledResponse();
    const policy = new TransportPolicy();
    let error: unknown;
    try {
      await policy.request({
        endpoint: FIRST,
        url: `${FIRST}/x`,
        consume: (res) => res.text(),
        profile: { stallTimeoutMs: 20 }
      });
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(TransportError);
    expect((error as TransportError).kind).to.equal("stall");
  });

  it("retries a 429 on the same gateway after the Retry-After delay", async () => {
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      requests.push(input.toString());
      return requests.length === 1
        ? new Response("slow down", { status: 429, headers: { "Retry-After": "2" } })
        : new Response("ok");
    };
    const sleeps: number[] = [];

    const result = await client({ sleeps }).fetch("/ipfs/cid", {}, (res) => res.text());

    expect(result).to.equal("ok");
    expect(requests).to.deep.equal([`${FIRST}/ipfs/cid`, `${FIRST}/ipfs/cid`]);
    expect(sleeps).to.deep.equal([2000]);
  });

  it("moves to the next gateway when Retry-After is longer than 10 s", async () => {
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      requests.push(input.toString());
      return input.toString().startsWith(FIRST)
        ? new Response("slow down", { status: 503, headers: { "Retry-After": "60" } })
        : new Response("ok");
    };
    const sleeps: number[] = [];

    expect(await client({ sleeps }).fetch("/ipfs/cid", {}, (res) => res.text())).to.equal("ok");
    expect(requests).to.deep.equal([`${FIRST}/ipfs/cid`, `${SECOND}/ipfs/cid`]);
    expect(sleeps).to.deep.equal([]);
  });

  it("retries network errors on the same gateway with capped exponential backoff", async () => {
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      requests.push(input.toString());
      if (requests.length === 1) throw new TypeError("fetch failed");
      return new Response("ok");
    };
    const sleeps: number[] = [];

    expect(await client({ sleeps }).fetch("/ipfs/cid", {}, (res) => res.text())).to.equal("ok");
    expect(requests).to.deep.equal([`${FIRST}/ipfs/cid`, `${FIRST}/ipfs/cid`]);
    // random() = 1 gives the full first backoff window
    expect(sleeps).to.deep.equal([500]);
  });

  it("goes straight to the next gateway on 404", async () => {
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      requests.push(input.toString());
      return input.toString().startsWith(FIRST) ? new Response("no", { status: 404 }) : new Response("ok");
    };
    const sleeps: number[] = [];

    expect(await client({ sleeps }).fetch("/ipfs/cid", {}, (res) => res.text())).to.equal("ok");
    expect(requests).to.deep.equal([`${FIRST}/ipfs/cid`, `${SECOND}/ipfs/cid`]);
    expect(sleeps).to.deep.equal([]);
  });

  it("does not retry integrity failures on the same gateway", async () => {
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      requests.push(input.toString());
      return new Response(input.toString().startsWith(FIRST) ? "corrupt" : '"ok"');
    };

    expect(await client().fetch("/ipfs/cid", {}, (res) => res.json())).to.equal("ok");
    expect(requests).to.deep.equal([`${FIRST}/ipfs/cid`, `${SECOND}/ipfs/cid`]);
  });

  it("cools down a gateway after three failures, and a success resets it", async () => {
    let now = 0;
    let firstHealthy = false;
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      requests.push(input.toString());
      if (input.toString().startsWith(FIRST) && !firstHealthy) throw new TypeError("fetch failed");
      return new Response("ok");
    };
    const gatewayClient = client({ now: () => now });

    for (let i = 0; i < 3; i++) await gatewayClient.fetch("/ipfs/cid", {}, (res) => res.text());
    expect(gatewayClient.orderedGatewayUrls()).to.deep.equal([SECOND, FIRST]);

    // While cooling down the first gateway is only a last resort
    requests.length = 0;
    await gatewayClient.fetch("/ipfs/cid", {}, (res) => res.text());
    expect(requests).to.deep.equal([`${SECOND}/ipfs/cid`]);

    // After the 60 s cooldown it is tried first again, and a success resets its failure count
    now += 60_001;
    firstHealthy = true;
    expect(gatewayClient.orderedGatewayUrls()).to.deep.equal([FIRST, SECOND]);
    await gatewayClient.fetch("/ipfs/cid", {}, (res) => res.text());
    firstHealthy = false;
    await gatewayClient.fetch("/ipfs/cid", {}, (res) => res.text());
    expect(gatewayClient.orderedGatewayUrls()).to.deep.equal([FIRST, SECOND]);
  });

  it("still tries a gateway that is cooling down when all gateways are cooling down", async () => {
    let failing = true;
    globalThis.fetch = async () => {
      if (failing) throw new TypeError("fetch failed");
      return new Response("ok");
    };
    const gatewayClient = client({ now: () => 0 });
    for (let i = 0; i < 3; i++) {
      await gatewayClient.fetch("/ipfs/cid", {}, (res) => res.text()).catch(() => undefined);
    }
    failing = false;
    expect(await gatewayClient.fetch("/ipfs/cid", {}, (res) => res.text())).to.equal("ok");
  });

  it("keeps gateway health when the gateway list is replaced", async () => {
    globalThis.fetch = async (input) => {
      if (input.toString().startsWith(FIRST)) throw new TypeError("fetch failed");
      return new Response("ok");
    };
    const gatewayClient = client({ now: () => 0 });
    for (let i = 0; i < 3; i++) await gatewayClient.fetch("/ipfs/cid", {}, (res) => res.text());

    gatewayClient.setGatewayUrls([`${FIRST}/`, SECOND]);

    expect(gatewayClient.orderedGatewayUrls()).to.deep.equal([SECOND, FIRST]);
  });

  it("limits in-flight requests per host to 6", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    globalThis.fetch = async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight--;
      return new Response("ok");
    };
    const gatewayClient = client();

    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => gatewayClient.fetch(`/ipfs/cid${i}`, {}, (res) => res.text()))
    );

    expect(results).to.have.length(20);
    expect(maxInFlight).to.equal(6);
  });

  it("stops everything when the caller aborts, without failing over", async () => {
    const requests: string[] = [];
    globalThis.fetch = async (input, init) => {
      requests.push(input.toString());
      return await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      });
    };
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10);

    let error: unknown;
    try {
      await client().fetch("/ipfs/cid", { signal: controller.signal }, (res) => res.text());
    } catch (e) {
      error = e;
    }

    expect(error).to.be.instanceOf(TransportError);
    expect((error as TransportError).kind).to.equal("aborted");
    expect(requests).to.deep.equal([`${FIRST}/ipfs/cid`]);
  });

  it("parses Retry-After as seconds or as an HTTP date", () => {
    expect(parseRetryAfter("3")).to.equal(3000);
    expect(parseRetryAfter(new Date(10_000).toUTCString(), 4_000)).to.equal(6000);
    expect(parseRetryAfter("soon")).to.equal(undefined);
    expect(parseRetryAfter(null)).to.equal(undefined);
  });
});
