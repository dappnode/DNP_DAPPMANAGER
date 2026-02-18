import { expect } from "chai";
import { createHash } from "crypto";
import { HttpMirrorMapSource } from "../../src/repository/contentProvider/mirrorMapCache.js";
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

  it("mapping hit + mirror download fail (single attempt, no retries)", async () => {
    let mirrorDownloadCalls = 0;
    const fetchStub = async (input: string | URL): Promise<Response> => {
      const url = input.toString();
      if (url === mapUrl) return jsonResponse({ [cid]: mirrorAssetUrl });
      if (url === mirrorAssetUrl) {
        mirrorDownloadCalls += 1;
        return new Response("not-found", { status: 404 });
      }
      throw Error(`Unexpected URL ${url}`);
    };

    const provider = createMirrorProvider({ mapUrl, fetchStub });
    const result = await provider.fetchByCid(cid);

    expect(result.status).to.equal("failed");
    expect(mirrorDownloadCalls).to.equal(1);
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

  it("mapping fetch fails", async () => {
    const fetchStub = async (input: string | URL): Promise<Response> => {
      const url = input.toString();
      if (url === mapUrl) return new Response("boom", { status: 500 });
      throw Error(`Unexpected URL ${url}`);
    };

    const provider = createMirrorProvider({ mapUrl, fetchStub });
    const result = await provider.fetchByCid(cid);

    expect(result.status).to.equal("miss");
  });

  it("map is fetched on every lookup (no cache)", async () => {
    let fetchCount = 0;
    const source = new HttpMirrorMapSource({
      mapUrl,
      timeoutMs: 1000,
      fetchFn: async (): Promise<Response> => {
        fetchCount += 1;
        if (fetchCount === 1) return jsonResponse({ [cid]: "https://mirror.dappnode.test/first.txz" });
        return jsonResponse({ [cid]: "https://mirror.dappnode.test/second.txz" });
      }
    });

    const first = await source.getEntry(cid);
    const second = await source.getEntry(cid);

    expect(fetchCount).to.equal(2);
    expect(first?.url).to.equal("https://mirror.dappnode.test/first.txz");
    expect(second?.url).to.equal("https://mirror.dappnode.test/second.txz");
  });
});

function createMirrorProvider({ mapUrl, fetchStub }: { mapUrl: string; fetchStub: typeof fetch }): HttpMirrorProvider {
  const mapSource = new HttpMirrorMapSource({
    mapUrl,
    timeoutMs: 2000,
    fetchFn: fetchStub
  });

  return new HttpMirrorProvider({
    mapSource,
    timeoutMs: 3000,
    maxDownloadBytes: 10 * 1024 * 1024,
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
