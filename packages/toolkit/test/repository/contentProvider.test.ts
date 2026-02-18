import { expect } from "chai";
import { HttpMirrorProvider } from "../../src/repository/contentProvider/mirrorProvider.js";
import { normalizeCid, roundProgress } from "../../src/repository/contentProvider/utils.js";

// Helper to save and restore global.fetch
let originalFetch: typeof globalThis.fetch;

describe("ContentProvider Utils", () => {
  describe("normalizeCid", () => {
    it("should remove /ipfs/ prefix", () => {
      expect(normalizeCid("/ipfs/QmTest123")).to.equal("QmTest123");
    });

    it("should remove ipfs/ prefix without leading slash", () => {
      expect(normalizeCid("ipfs/QmTest123")).to.equal("QmTest123");
    });

    it("should remove trailing slashes", () => {
      expect(normalizeCid("QmTest123/")).to.equal("QmTest123");
      expect(normalizeCid("QmTest123///")).to.equal("QmTest123");
    });

    it("should handle already normalized CID", () => {
      expect(normalizeCid("QmTest123")).to.equal("QmTest123");
    });

    it("should ignore subpaths", () => {
      expect(normalizeCid("QmTest123/subpath/file.txt")).to.equal("QmTest123");
    });
  });

  describe("roundProgress", () => {
    it("should calculate percentage correctly", () => {
      expect(roundProgress(50, 100)).to.equal(50);
      expect(roundProgress(1, 4)).to.equal(25);
    });

    it("should round to nearest percent by default", () => {
      expect(roundProgress(33, 100)).to.equal(33);
      expect(roundProgress(33.4, 100)).to.equal(33);
      expect(roundProgress(33.6, 100)).to.equal(34);
    });

    it("should respect custom resolution", () => {
      expect(roundProgress(33, 100, 5)).to.equal(35); // Round to nearest 5
      expect(roundProgress(37, 100, 10)).to.equal(40); // Round to nearest 10
    });

    it("should cap at 100%", () => {
      expect(roundProgress(150, 100)).to.equal(100);
    });

    it("should return 0 for zero total", () => {
      expect(roundProgress(50, 0)).to.equal(0);
    });
  });
});

describe("HttpMirrorProvider", () => {
  let provider: HttpMirrorProvider;
  const baseUrl = "https://test-mirror.example.com";
  const timeoutMs = 5000;
  const maxBytes = 1024 * 1024; // 1MB
  let fetchCalls: { url: string; opts: any }[];

  function mockFetch(response: any, shouldReject = false) {
    fetchCalls = [];
    (globalThis as any).fetch = async (url: string, opts: any) => {
      fetchCalls.push({ url, opts });
      if (shouldReject) throw response;
      return response;
    };
  }

  before(() => {
    originalFetch = globalThis.fetch;
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    provider = new HttpMirrorProvider(baseUrl, timeoutMs, maxBytes);
    fetchCalls = [];
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("list", () => {
    it("should list directory contents successfully", async () => {
      mockFetch({
        ok: true,
        json: async () => [
          { name: "file1.txt", type: "file", size: 100, mtime: "2026-02-18T12:00:00Z" },
          { name: "file2.txt", type: "file", size: 200, mtime: "2026-02-18T12:00:00Z" }
        ]
      });

      const result = await provider.list("QmTestCid");

      expect(result).to.have.lengthOf(2);
      expect(result[0].name).to.equal("file1.txt");
      expect(result[0].size).to.equal(100);
      expect(result[1].name).to.equal("file2.txt");

      // Verify correct URL was called
      expect(fetchCalls).to.have.lengthOf(1);
      expect(fetchCalls[0].url).to.equal(`${baseUrl}/QmTestCid/`);
    });

    it("should normalize CID before making request", async () => {
      mockFetch({
        ok: true,
        json: async () => []
      });

      await provider.list("/ipfs/QmTestCid/");

      expect(fetchCalls[0].url).to.equal(`${baseUrl}/QmTestCid/`);
    });

    it("should handle HTTP errors", async () => {
      mockFetch({
        ok: false,
        status: 404,
        statusText: "Not Found"
      });

      try {
        await provider.list("QmTestCid");
        expect.fail("Should have thrown");
      } catch (e: any) {
        expect(e.message).to.include("Mirror list failed: 404 Not Found");
      }
    });

    it("should handle network errors", async () => {
      mockFetch(new Error("Network error"), true);

      try {
        await provider.list("QmTestCid");
        expect.fail("Should have thrown");
      } catch (e: any) {
        expect(e.message).to.include("Network error");
      }
    });

    it("should validate response is an array", async () => {
      mockFetch({
        ok: true,
        json: async () => ({ invalid: "response" })
      });

      try {
        await provider.list("QmTestCid");
        expect.fail("Should have thrown");
      } catch (e: any) {
        expect(e.message).to.include("Mirror list response is not an array");
      }
    });
  });

  describe("fetchFile", () => {
    it("should download file successfully", async () => {
      const testContent = new Uint8Array([1, 2, 3, 4, 5]);
      mockFetch({
        ok: true,
        headers: new Map([["content-length", "5"]]),
        arrayBuffer: async () => testContent.buffer
      });

      const result = await provider.fetchFile("QmTestCid", "test.txt");

      expect(result.status).to.equal("success");
      if (result.status === "success") {
        expect(new Uint8Array(result.bytes)).to.deep.equal(testContent);
        expect(result.urlHost).to.equal("test-mirror.example.com");
      }

      // Verify correct URL was called
      expect(fetchCalls[0].url).to.equal(`${baseUrl}/QmTestCid/test.txt`);
    });

    it("should handle HTTP 404 errors gracefully", async () => {
      mockFetch({
        ok: false,
        status: 404,
        statusText: "Not Found"
      });

      const result = await provider.fetchFile("QmTestCid", "missing.txt");

      expect(result.status).to.equal("failed");
      if (result.status === "failed") {
        expect(result.reason).to.equal("http_error_404");
      }
    });

    it("should reject files exceeding max size", async () => {
      mockFetch({
        ok: true,
        headers: new Map([["content-length", String(maxBytes + 1)]]),
        arrayBuffer: async () => new Uint8Array(maxBytes + 1).buffer
      });

      const result = await provider.fetchFile("QmTestCid", "large.bin");

      expect(result.status).to.equal("failed");
      if (result.status === "failed") {
        expect(result.reason).to.include("file_too_large");
      }
    });

    it("should handle network errors gracefully", async () => {
      mockFetch(new Error("Connection refused"), true);

      const result = await provider.fetchFile("QmTestCid", "test.txt");

      expect(result.status).to.equal("failed");
      if (result.status === "failed") {
        expect(result.reason).to.equal("Connection refused");
      }
    });

    it("should support progress callbacks", async () => {
      const progressCalls: number[] = [];
      let readCallCount = 0;

      mockFetch({
        ok: true,
        headers: new Map([["content-length", "1000"]]),
        body: {
          getReader: () => ({
            read: async () => {
              readCallCount++;
              if (readCallCount <= 2) {
                return { done: false, value: new Uint8Array(500) };
              }
              return { done: true };
            },
            releaseLock: () => {}
          })
        }
      });

      const result = await provider.fetchFile("QmTestCid", "test.txt", {
        onProgress: (p: number) => progressCalls.push(p)
      });

      expect(result.status).to.equal("success");
      expect(progressCalls.length).to.be.greaterThan(0);
      expect(progressCalls[progressCalls.length - 1]).to.equal(100); // Should end at 100%
    });
  });

  describe("fetchByCid", () => {
    it("should fetch content by CID directly", async () => {
      const testContent = new Uint8Array([1, 2, 3]);
      mockFetch({
        ok: true,
        headers: new Map([["content-length", "3"]]),
        arrayBuffer: async () => testContent.buffer
      });

      const result = await provider.fetchByCid("QmTestCid");

      expect(result.status).to.equal("success");

      // Verify correct URL was called (without filename)
      expect(fetchCalls[0].url).to.equal(`${baseUrl}/QmTestCid`);
    });
  });
});
