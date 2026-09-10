import { expect } from "chai";
import { DappnodeCache } from "../../src/DappnodeCache.js";

describe("DappnodeCache", () => {
  let cache: DappnodeCache<string, string>;

  beforeEach(() => {
    cache = new DappnodeCache<string, string>({
      max: 5,
      ttl: 1000, // 1 second for testing
    });
  });

  describe("basic operations", () => {
    it("should set and get values", () => {
      cache.set("key1", "value1");
      expect(cache.get("key1")).to.equal("value1");
    });

    it("should return undefined for non-existent keys", () => {
      expect(cache.get("nonexistent")).to.be.undefined;
    });

    it("should check if key exists", () => {
      cache.set("key1", "value1");
      expect(cache.has("key1")).to.be.true;
      expect(cache.has("nonexistent")).to.be.false;
    });

    it("should delete keys", () => {
      cache.set("key1", "value1");
      expect(cache.has("key1")).to.be.true;
      expect(cache.delete("key1")).to.be.true;
      expect(cache.has("key1")).to.be.false;
      expect(cache.delete("nonexistent")).to.be.false;
    });

    it("should clear all items", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      expect(cache.size).to.equal(2);
      cache.clear();
      expect(cache.size).to.equal(0);
    });

    it("should report correct size", () => {
      expect(cache.size).to.equal(0);
      cache.set("key1", "value1");
      expect(cache.size).to.equal(1);
      cache.set("key2", "value2");
      expect(cache.size).to.equal(2);
    });
  });

  describe("LRU eviction", () => {
    it("should evict least recently used items when max is exceeded", () => {
      // Fill cache to max
      for (let i = 1; i <= 5; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      expect(cache.size).to.equal(5);

      // Add one more item, should evict the first one
      cache.set("key6", "value6");
      expect(cache.size).to.equal(5);
      expect(cache.has("key1")).to.be.false; // Evicted
      expect(cache.has("key6")).to.be.true; // New item
    });
  });

  describe("getOrSet", () => {
    it("should return cached value if exists", async () => {
      cache.set("key1", "cached_value");
      let factoryCalled = false;

      const result = await cache.getOrSet("key1", async () => {
        factoryCalled = true;
        return "factory_value";
      });

      expect(result).to.equal("cached_value");
      expect(factoryCalled).to.be.false;
    });

    it("should call factory and cache result if not exists", async () => {
      let factoryCalled = false;

      const result = await cache.getOrSet("key1", async () => {
        factoryCalled = true;
        return "factory_value";
      });

      expect(result).to.equal("factory_value");
      expect(factoryCalled).to.be.true;
      expect(cache.get("key1")).to.equal("factory_value");
    });
  });

  describe("stats", () => {
    it("should provide cache statistics", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");

      const stats = cache.getStats();
      expect(stats.size).to.equal(2);
      expect(stats.max).to.equal(5);
      expect(typeof stats.calculatedSize).to.equal("number");
    });
  });
});