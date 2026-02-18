import { describe, it, expect, beforeEach, vi } from "vitest";
import { HttpMirrorProvider } from "../../src/repository/contentProvider/mirrorProvider.js";
import { normalizeCid, roundProgress } from "../../src/repository/contentProvider/utils.js";

describe("ContentProvider Utils", () => {
  describe("normalizeCid", () => {
    it("should remove /ipfs/ prefix", () => {
      expect(normalizeCid("/ipfs/QmTest123")).toBe("QmTest123");
    });

    it("should remove ipfs/ prefix without leading slash", () => {
      expect(normalizeCid("ipfs/QmTest123")).toBe("QmTest123");
    });

    it("should remove trailing slashes", () => {
      expect(normalizeCid("QmTest123/")).toBe("QmTest123");
      expect(normalizeCid("QmTest123///")).toBe("QmTest123");
    });

    it("should handle already normalized CID", () => {
      expect(normalizeCid("QmTest123")).toBe("QmTest123");
    });

    it("should ignore subpaths", () => {
      expect(normalizeCid("QmTest123/subpath/file.txt")).toBe("QmTest123");
    });
  });

  describe("roundProgress", () => {
    it("should calculate percentage correctly", () => {
      expect(roundProgress(50, 100)).toBe(50);
      expect(roundProgress(1, 4)).toBe(25);
    });

    it("should round to nearest percent by default", () => {
      expect(roundProgress(33, 100)).toBe(33);
      expect(roundProgress(33.4, 100)).toBe(33);
      expect(roundProgress(33.6, 100)).toBe(34);
    });

    it("should respect custom resolution", () => {
      expect(roundProgress(33, 100, 5)).toBe(35); // Round to nearest 5
      expect(roundProgress(37, 100, 10)).toBe(40); // Round to nearest 10
    });

    it("should cap at 100%", () => {
      expect(roundProgress(150, 100)).toBe(100);
    });

    it("should return 0 for zero total", () => {
      expect(roundProgress(50, 0)).toBe(0);
    });
  });
});

describe("HttpMirrorProvider", () => {
  let provider: HttpMirrorProvider;
  const baseUrl = "https://test-mirror.example.com";
  const timeoutMs = 5000;
  const maxBytes = 1024 * 1024; // 1MB

  beforeEach(() => {
    provider = new HttpMirrorProvider(baseUrl, timeoutMs, maxBytes);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should list directory contents successfully", async () => {
      // Mock fetch to return directory listing (without individual file CIDs)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { name: "file1.txt", type: "file", size: 100, mtime: "2026-02-18T12:00:00Z" },
          { name: "file2.txt", type: "file", size: 200, mtime: "2026-02-18T12:00:00Z" }
        ]
      });

      const result = await provider.list("QmTestCid");

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("file1.txt");
      expect(result[0].size).toBe(100);
      expect(result[1].name).toBe("file2.txt");

      // Verify correct URL was called
      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/QmTestCid/`,
        expect.objectContaining({
          headers: { Accept: "application/json" }
        })
      );
    });

    it("should normalize CID before making request", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => []
      });

      await provider.list("/ipfs/QmTestCid/");

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/QmTestCid/`,
        expect.anything()
      );
    });

    it("should handle HTTP errors", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found"
      });

      await expect(provider.list("QmTestCid")).rejects.toThrow("Mirror list failed: 404 Not Found");
    });

    it("should handle network errors", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(provider.list("QmTestCid")).rejects.toThrow("Network error");
    });

    it("should validate response is an array", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: "response" })
      });

      await expect(provider.list("QmTestCid")).rejects.toThrow("Mirror list response is not an array");
    });
  });

  describe("fetchFile", () => {
    it("should download file successfully", async () => {
      const testContent = new Uint8Array([1, 2, 3, 4, 5]);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([["content-length", "5"]]),
        arrayBuffer: async () => testContent.buffer
      });

      const result = await provider.fetchFile("QmTestCid", "test.txt");

      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.bytes).toEqual(testContent);
        expect(result.urlHost).toBe("test-mirror.example.com");
      }

      // Verify correct URL was called
      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/QmTestCid/test.txt`,
        expect.objectContaining({
          headers: { Accept: "application/octet-stream" }
        })
      );
    });

    it("should handle HTTP 404 errors gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found"
      });

      const result = await provider.fetchFile("QmTestCid", "missing.txt");

      expect(result.status).toBe("failed");
      if (result.status === "failed") {
        expect(result.reason).toBe("http_error_404");
      }
    });

    it("should reject files exceeding max size", async () => {
      const largeContent = new Uint8Array(maxBytes + 1);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([["content-length", String(maxBytes + 1)]]),
        arrayBuffer: async () => largeContent.buffer
      });

      const result = await provider.fetchFile("QmTestCid", "large.bin");

      expect(result.status).toBe("failed");
      if (result.status === "failed") {
        expect(result.reason).toContain("file_too_large");
      }
    });

    it("should handle network errors gracefully", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

      const result = await provider.fetchFile("QmTestCid", "test.txt");

      expect(result.status).toBe("failed");
      if (result.status === "failed") {
        expect(result.reason).toBe("Connection refused");
      }
    });

    it("should support progress callbacks", async () => {
      const testContent = new Uint8Array(1000);
      const progressCalls: number[] = [];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([["content-length", "1000"]]),
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({ done: false, value: new Uint8Array(500) })
              .mockResolvedValueOnce({ done: false, value: new Uint8Array(500) })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn()
          })
        }
      });

      const result = await provider.fetchFile("QmTestCid", "test.txt", {
        onProgress: (p) => progressCalls.push(p)
      });

      expect(result.status).toBe("success");
      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[progressCalls.length - 1]).toBe(100); // Should end at 100%
    });
  });

  describe("fetchByCid", () => {
    it("should fetch content by CID directly", async () => {
      const testContent = new Uint8Array([1, 2, 3]);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Map([["content-length", "3"]]),
        arrayBuffer: async () => testContent.buffer
      });

      const result = await provider.fetchByCid("QmTestCid");

      expect(result.status).toBe("success");

      // Verify correct URL was called (without filename)
      expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/QmTestCid`, expect.anything());
    });
  });
});
