import { expect } from "chai";
import { createHash } from "crypto";
import { CidContentProviderResolver } from "../../src/repository/contentProvider/contentProviderResolver.js";
import { HttpMirrorMapCache } from "../../src/repository/contentProvider/mirrorMapCache.js";
import { HttpMirrorProvider } from "../../src/repository/contentProvider/mirrorProvider.js";
import { ContentProviderEvent, IpfsProvider } from "../../src/repository/contentProvider/types.js";

describe("CID content providers", () => {
  const mapUrl = "https://mirror.dappnode.test/content-map.json";
  const cid = "QmTestCid111111111111111111111111111111111111";
  const mirrorAssetUrl = "https://mirror.dappnode.test/assets/cid.txz";

  it("uses mirror provider on mapping hit and successful download", async () => {
    const mirrorPayload = Buffer.from("mirror-ok");
    const sha256 = createHash("sha256").update(mirrorPayload).digest("hex");

    const fetchStub = async (input: string | URL): Promise<Response> => {
      const url = input.toString();
      if (url === mapUrl) return jsonResponse({ [cid]: { url: mirrorAssetUrl, sha256 } });
      if (url === mirrorAssetUrl) return binaryResponse(mirrorPayload);
      throw Error(`Unexpected URL ${url}`);
    };

    const resolver = createResolver({
      mapUrl,
      fetchStub,
      ipfsProvider: fakeIpfsProvider(Buffer.from("ipfs-fallback"))
    });

    const result = await resolver.fetchByCid(cid);
    expect(result.provider).to.equal("mirror");
    expect(Buffer.from(result.bytes).toString()).to.equal("mirror-ok");
  });

  it("falls back to ipfs when mirror download fails", async () => {
    const ipfsProvider = fakeIpfsProvider(Buffer.from("ipfs-fallback"));
    const events: ContentProviderEvent[] = [];

    const fetchStub = async (input: string | URL): Promise<Response> => {
      const url = input.toString();
      if (url === mapUrl) return jsonResponse({ [cid]: mirrorAssetUrl });
      if (url === mirrorAssetUrl) return new Response("not found", { status: 404 });
      throw Error(`Unexpected URL ${url}`);
    };

    const resolver = createResolver({
      mapUrl,
      fetchStub,
      ipfsProvider
    });

    const result = await resolver.fetchByCid(cid, {
      onContentProviderEvent: (event) => events.push(event)
    });

    expect(result.provider).to.equal("ipfs");
    expect(ipfsProvider.calls).to.equal(1);
    expect(events.find((event) => event.provider === "mirror" && event.status === "failed")).to.exist;
    expect(
      events.find(
        (event) => event.provider === "ipfs" && event.status === "success" && event.reason === "mirror-failed"
      )
    ).to.exist;
  });

  it("uses ipfs when mapping does not contain cid", async () => {
    const ipfsProvider = fakeIpfsProvider(Buffer.from("ipfs-only"));
    const events: ContentProviderEvent[] = [];

    const fetchStub = async (input: string | URL): Promise<Response> => {
      const url = input.toString();
      if (url === mapUrl) return jsonResponse({});
      throw Error(`Unexpected URL ${url}`);
    };

    const resolver = createResolver({
      mapUrl,
      fetchStub,
      ipfsProvider
    });

    const result = await resolver.fetchByCid(cid, {
      onContentProviderEvent: (event) => events.push(event)
    });

    expect(result.provider).to.equal("ipfs");
    expect(ipfsProvider.calls).to.equal(1);
    expect(
      events.find(
        (event) => event.provider === "ipfs" && event.status === "success" && event.reason === "mirror-miss"
      )
    ).to.exist;
  });

  it("falls back to ipfs when map fetch fails", async () => {
    const ipfsProvider = fakeIpfsProvider(Buffer.from("ipfs-on-map-error"));

    const fetchStub = async (input: string | URL): Promise<Response> => {
      const url = input.toString();
      if (url === mapUrl) throw Error("network error");
      throw Error(`Unexpected URL ${url}`);
    };

    const resolver = createResolver({
      mapUrl,
      fetchStub,
      ipfsProvider
    });

    const result = await resolver.fetchByCid(cid);
    expect(result.provider).to.equal("ipfs");
    expect(ipfsProvider.calls).to.equal(1);
  });

  it("refreshes mapping after ttl and reuses stale map while refreshing", async () => {
    let now = 0;
    let fetchCount = 0;

    const mirrorMapCache = new HttpMirrorMapCache({
      mapUrl,
      ttlMs: 1000,
      timeoutMs: 1000,
      now: () => now,
      fetchFn: async (input: string | URL): Promise<Response> => {
        const url = input.toString();
        if (url !== mapUrl) throw Error(`Unexpected URL ${url}`);
        fetchCount += 1;
        if (fetchCount === 1) return jsonResponse({ [cid]: "https://mirror.dappnode.test/first.txz" });
        return jsonResponse({ [cid]: "https://mirror.dappnode.test/second.txz" });
      }
    });

    const firstEntry = await mirrorMapCache.getEntry(cid);
    expect(firstEntry?.url).to.equal("https://mirror.dappnode.test/first.txz");
    expect(fetchCount).to.equal(1);

    now = 500;
    const withinTtlEntry = await mirrorMapCache.getEntry(cid);
    expect(withinTtlEntry?.url).to.equal("https://mirror.dappnode.test/first.txz");
    expect(fetchCount).to.equal(1);

    now = 1500;
    const staleEntry = await mirrorMapCache.getEntry(cid);
    expect(staleEntry?.url).to.equal("https://mirror.dappnode.test/first.txz");
    expect(fetchCount).to.equal(2);

    await new Promise((resolve) => setTimeout(resolve, 0));
    const refreshedEntry = await mirrorMapCache.getEntry(cid);
    expect(refreshedEntry?.url).to.equal("https://mirror.dappnode.test/second.txz");
  });
});

function createResolver({
  mapUrl,
  fetchStub,
  ipfsProvider
}: {
  mapUrl: string;
  fetchStub: typeof fetch;
  ipfsProvider: ReturnType<typeof fakeIpfsProvider>;
}): CidContentProviderResolver {
  const mapCache = new HttpMirrorMapCache({
    mapUrl,
    ttlMs: 30 * 1000,
    timeoutMs: 1000,
    fetchFn: fetchStub
  });

  const mirrorProvider = new HttpMirrorProvider({
    mapCache,
    timeoutMs: 2000,
    retries: 0,
    maxDownloadBytes: 10 * 1024 * 1024,
    allowHttpUrls: false,
    fetchFn: fetchStub
  });

  return new CidContentProviderResolver({
    mirrorProvider,
    ipfsProvider
  });
}

function fakeIpfsProvider(payload: Buffer): IpfsProvider & { calls: number } {
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    async fetchByCid() {
      calls += 1;
      return {
        provider: "ipfs",
        bytes: new Uint8Array(payload)
      };
    }
  };
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: {
      "content-type": "application/json"
    }
  });
}

function binaryResponse(value: Uint8Array): Response {
  return new Response(value, {
    status: 200,
    headers: {
      "content-type": "application/octet-stream",
      "content-length": String(value.length)
    }
  });
}
