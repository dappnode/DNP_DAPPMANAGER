import { expect } from "chai";
import { createHash } from "crypto";
import { HttpMirrorMapCache } from "../../src/repository/contentProvider/mirrorMapCache.js";
import { HttpMirrorProvider } from "../../src/repository/contentProvider/mirrorProvider.js";

describe("Mirror content provider", () => {
  const mapUrl = "https://mirror.dappnode.test/content-map.json";
  const cid = "QmTestCid111111111111111111111111111111111111";
  const mirrorAssetUrl = "https://mirror.dappnode.test/assets/cid.txz";

  it("mapping hit + mirror download success", async () => {
    const payload = Buffer.from("mirror-ok");
    const sha256 = createHash("sha256").update(payload).digest("hex");
    const fetchStub = async (input: string | URL): Promise<Response> => {
      const url = input.toString();
      if (url === mapUrl) return jsonResponse({ [cid]: { url: mirrorAssetUrl, sha256 } });
      if (url === mirrorAssetUrl) return binaryResponse(payload);
      throw Error(`Unexpected URL ${url}`);
    };

    const provider = createMirrorProvider({ mapUrl, fetchStub });
    const result = await provider.fetchByCid(cid);

    expect(result.status).to.equal("success");
    if (result.status === "success") expect(Buffer.from(result.bytes).toString()).to.equal("mirror-ok");
  });

  it("mapping hit + mirror download fail", async () => {
    const fetchStub = async (input: string | URL): Promise<Response> => {
      const url = input.toString();
      if (url === mapUrl) return jsonResponse({ [cid]: mirrorAssetUrl });
      if (url === mirrorAssetUrl) return new Response("not-found", { status: 404 });
      throw Error(`Unexpected URL ${url}`);
    };

    const provider = createMirrorProvider({ mapUrl, fetchStub });
    const result = await provider.fetchByCid(cid);

    expect(result.status).to.equal("failed");
  });

  it("mapping miss", async () => {
    const fetchStub = async (input: string | URL): Promise<Response> => {
      const url = input.toString();
      if (url === mapUrl) return jsonResponse({});
      throw Error(`Unexpected URL ${url}`);
    };

    const provider = createMirrorProvider({ mapUrl, fetchStub });
    const result = await provider.fetchByCid(cid);

    expect(result.status).to.equal("miss");
  });

  it("mapping cache stale-while-revalidate", async () => {
    let now = 0;
    let fetchCount = 0;

    const cache = new HttpMirrorMapCache({
      mapUrl,
      ttlMs: 1000,
      timeoutMs: 1000,
      now: () => now,
      fetchFn: async (): Promise<Response> => {
        fetchCount += 1;
        if (fetchCount === 1) return jsonResponse({ [cid]: "https://mirror.dappnode.test/first.txz" });
        return jsonResponse({ [cid]: "https://mirror.dappnode.test/second.txz" });
      }
    });

    const first = await cache.getEntry(cid);
    expect(first?.url).to.equal("https://mirror.dappnode.test/first.txz");

    now = 1500;
    const stale = await cache.getEntry(cid);
    expect(stale?.url).to.equal("https://mirror.dappnode.test/first.txz");

    await new Promise((resolve) => setTimeout(resolve, 0));
    const refreshed = await cache.getEntry(cid);
    expect(refreshed?.url).to.equal("https://mirror.dappnode.test/second.txz");
  });
});

function createMirrorProvider({ mapUrl, fetchStub }: { mapUrl: string; fetchStub: typeof fetch }): HttpMirrorProvider {
  const mapCache = new HttpMirrorMapCache({
    mapUrl,
    ttlMs: 60 * 1000,
    timeoutMs: 2000,
    fetchFn: fetchStub
  });

  return new HttpMirrorProvider({
    mapCache,
    timeoutMs: 3000,
    retries: 0,
    maxDownloadBytes: 10 * 1024 * 1024,
    allowHttpUrls: false,
    fetchFn: fetchStub
  });
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
