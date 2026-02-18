import { expect } from "chai";
import { HttpMirrorProvider } from "../../src/repository/contentProvider/mirrorProvider.js";

describe("Mirror content provider", () => {
  const baseUrl = "https://packages.dappnode.test";
  const cid = "QmTestCid111111111111111111111111111111111111";

  it("mirror download success", async () => {
    const payload = Buffer.from("mirror-ok");
    const expectedUrl = `${baseUrl}/${cid}/`;

    const fetchStub = async (input: string | URL): Promise<Response> => {
      const url = input.toString();
      if (url === expectedUrl) return binaryResponse(payload);
      throw Error(`Unexpected URL ${url}`);
    };

    const provider = createMirrorProvider({ baseUrl, fetchStub });
    const result = await provider.fetchByCid(cid);

    expect(result.status).to.equal("success");
    if (result.status === "success") {
      expect(Buffer.from(result.bytes).toString()).to.equal("mirror-ok");
      expect(result.url).to.equal(expectedUrl);
    }
  });

  it("mirror download fail (single attempt, no retries)", async () => {
    let downloadCalls = 0;
    const expectedUrl = `${baseUrl}/${cid}/`;

    const fetchStub = async (input: string | URL): Promise<Response> => {
      const url = input.toString();
      if (url === expectedUrl) {
        downloadCalls += 1;
        return new Response("not-found", { status: 404 });
      }
      throw Error(`Unexpected URL ${url}`);
    };

    const provider = createMirrorProvider({ baseUrl, fetchStub });
    const result = await provider.fetchByCid(cid);

    expect(result.status).to.equal("failed");
    expect(result.url).to.equal(expectedUrl);
    expect(downloadCalls).to.equal(1);
  });

  it("constructs correct URL from CID", async () => {
    const fetchStub = async (input: string | URL): Promise<Response> => {
      const url = input.toString();
      expect(url).to.equal(`${baseUrl}/${cid}/`);
      return binaryResponse(Buffer.from("test"));
    };

    const provider = createMirrorProvider({ baseUrl, fetchStub });
    await provider.fetchByCid(cid);
  });

  it("handles baseUrl with trailing slash", async () => {
    const baseUrlWithSlash = "https://packages.dappnode.test/";
    const expectedUrl = `https://packages.dappnode.test/${cid}/`;

    const fetchStub = async (input: string | URL): Promise<Response> => {
      const url = input.toString();
      expect(url).to.equal(expectedUrl);
      return binaryResponse(Buffer.from("test"));
    };

    const provider = createMirrorProvider({ baseUrl: baseUrlWithSlash, fetchStub });
    await provider.fetchByCid(cid);
  });
});

function createMirrorProvider({ baseUrl, fetchStub }: { baseUrl: string; fetchStub: typeof fetch }): HttpMirrorProvider {
  return new HttpMirrorProvider({
    baseUrl,
    timeoutMs: 3000,
    maxDownloadBytes: 10 * 1024 * 1024,
    fetchFn: fetchStub
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
