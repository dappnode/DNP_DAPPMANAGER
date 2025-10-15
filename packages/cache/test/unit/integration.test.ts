import { expect } from "chai";
import { dappstoreCache, contractAddressCache, stakerConfigCache, getOrSet } from "../../src/index.js";

describe("Cache Integration", () => {
  beforeEach(() => {
    // Clear caches before each test
    dappstoreCache.clear();
    contractAddressCache.clear();
    stakerConfigCache.clear();
  });

  describe("dappstoreCache", () => {
    it("should cache package release data", async () => {
      const mockRelease = {
        dnpName: "test.dnp.dappnode.eth",
        manifest: { name: "test", version: "1.0.0" },
        avatarFile: { hash: "Qm123", source: "ipfs", size: 1000 }
      };

      let callCount = 0;
      const factory = async () => {
        callCount++;
        return mockRelease;
      };

      // First call should execute factory
      const result1 = await getOrSet(dappstoreCache, "release:test.dnp.dappnode.eth", factory);
      expect(result1).to.deep.equal(mockRelease);
      expect(callCount).to.equal(1);

      // Second call should use cache
      const result2 = await getOrSet(dappstoreCache, "release:test.dnp.dappnode.eth", factory);
      expect(result2).to.deep.equal(mockRelease);
      expect(callCount).to.equal(1); // Factory not called again
    });
  });

  describe("contractAddressCache", () => {
    it("should cache contract addresses", () => {
      const dnpName = "test.dnp.dappnode.eth";
      const contractAddress = "0x1234567890abcdef";

      // Set contract address
      contractAddressCache.set(dnpName, contractAddress);

      // Check if cached
      expect(contractAddressCache.has(dnpName)).to.be.true;
      expect(contractAddressCache.get(dnpName)).to.equal(contractAddress);
    });
  });

  describe("stakerConfigCache", () => {
    it("should cache staker configuration", async () => {
      const mockConfig = {
        executionClients: [],
        consensusClients: [],
        web3Signer: { name: "web3signer" },
        mevBoost: { name: "mev-boost" }
      };

      let callCount = 0;
      const factory = async () => {
        callCount++;
        return mockConfig;
      };

      // First call should execute factory
      const result1 = await getOrSet(stakerConfigCache, "stakerConfig:mainnet", factory);
      expect(result1).to.deep.equal(mockConfig);
      expect(callCount).to.equal(1);

      // Second call should use cache
      const result2 = await getOrSet(stakerConfigCache, "stakerConfig:mainnet", factory);
      expect(result2).to.deep.equal(mockConfig);
      expect(callCount).to.equal(1); // Factory not called again
    });

    it("should support cache invalidation", async () => {
      const mockConfig = { test: "config" };
      await getOrSet(stakerConfigCache, "stakerConfig:mainnet", async () => mockConfig);
      
      expect(stakerConfigCache.has("stakerConfig:mainnet")).to.be.true;
      
      // Invalidate cache
      stakerConfigCache.delete("stakerConfig:mainnet");
      
      expect(stakerConfigCache.has("stakerConfig:mainnet")).to.be.false;
    });
  });

  describe("cache eviction", () => {
    it("should evict old entries when max size is reached", () => {
      // Test with contractAddressCache (max: 200)
      for (let i = 0; i < 250; i++) {
        contractAddressCache.set(`package${i}.dnp.dappnode.eth`, `0x${i.toString(16)}`);
      }

      // Cache should not exceed max size
      expect(contractAddressCache.size).to.be.lessThanOrEqual(200);
      
      // Early entries should be evicted
      expect(contractAddressCache.has("package0.dnp.dappnode.eth")).to.be.false;
      
      // Recent entries should still be there
      expect(contractAddressCache.has("package249.dnp.dappnode.eth")).to.be.true;
    });
  });
});