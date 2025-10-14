import "mocha";
import { expect } from "chai";
import { DappGetFetcherMock, MockDnps } from "../testHelpers.js";
import aggregateDependencies from "../../../../src/dappGet/aggregate/aggregateDependencies.js";
import { cleanupDnps } from "../../../../src/dappGet/aggregate/cleanupDnp.js";
import { dappnodeInstaller } from "../../../testUtils.js";
import type { DappnodeInstaller as DappnodeInstallerType } from "../../../../src/dappnodeInstaller.js";
import type { DappGetDnps } from "../../../../src/dappGet/types.js";

/**
 * Purpose of the test. Make sure it is able recursively fetch a DNP's dependencies
 *
 * Tested with two cases:
 * > Case 1: Basic request.
 *   Test basic functionality, make sure the output is formated correctly
 *   REQ: 'kovan.dnp.dappnode.eth'
 *   DEPS:
 *   - 'kovan.dnp.dappnode.eth' => 'dependency.dnp.dappnode.eth'
 *   - 'dependency.dnp.dappnode.eth' => []
 *
 * > Case 2: Circular dependencies.
 *   Test against circular dependencies to make sure it doesn't crash due to an infinite loop
 *   REQ: 'dnpA.dnp.dappnode.eth'
 *   DEPS:
 *   - 'dnpA.dnp.dappnode.eth' => 'dnpB.dnp.dappnode.eth'
 *   - 'dnpB.dnp.dappnode.eth' => 'dnpC.dnp.dappnode.eth'
 *   - 'dnpC.dnp.dappnode.eth' => 'dnpA.dnp.dappnode.eth'
 */

describe("dappGet/aggregate/aggregateDependencies", () => {
  it("should fetch the correct dependencies", async () => {
    const mockDnps: MockDnps = {
      "kovan.dnp.dappnode.eth": {
        "0.1.0": { "dependency.dnp.dappnode.eth": "^0.1.1" },
        "0.1.1": { "dependency.dnp.dappnode.eth": "^0.1.1" },
        "0.1.2": { "dependency.dnp.dappnode.eth": "^0.1.1" },
        "0.2.0": { "dependency.dnp.dappnode.eth": "^0.1.1" },
        "0.2.1": { "dependency.dnp.dappnode.eth": "^0.1.1" }
      },
      "dependency.dnp.dappnode.eth": {
        "0.1.0": {},
        "0.1.1": {},
        "0.1.2": {},
        "0.2.0": {}
      }
    };

    const dappGetFetcher = new DappGetFetcherMock(mockDnps);

    const dnpName = "kovan.dnp.dappnode.eth";
    const versionRange = "0.1.0";
    const dnps: DappGetDnps = {};
    await aggregateDependencies({
      dappnodeInstaller,
      name: dnpName,
      versionRange,
      dnps,
      dappGetFetcher
    });

    expect(dnps).to.deep.equal({
      "kovan.dnp.dappnode.eth": {
        versions: {
          "0.1.0": { "dependency.dnp.dappnode.eth": "^0.1.1" }
        }
      },
      "dependency.dnp.dappnode.eth": {
        versions: {
          "0.1.1": {},
          "0.1.2": {}
        }
      }
    });
  });

  it("should not crash with circular dependencies", async () => {
    const mockDnps: MockDnps = {
      "dnpA.dnp.dappnode.eth": {
        "0.1.0": { "dnpB.dnp.dappnode.eth": "^0.1.0" }
      },
      "dnpB.dnp.dappnode.eth": {
        "0.1.0": { "dnpC.dnp.dappnode.eth": "^0.1.0" }
      },
      "dnpC.dnp.dappnode.eth": {
        "0.1.0": { "dnpA.dnp.dappnode.eth": "^0.1.0" }
      }
    };

    const dappGetFetcher = new DappGetFetcherMock(mockDnps);

    const dnpName = "dnpA.dnp.dappnode.eth";
    const versionRange = "0.1.0";
    const dnps: DappGetDnps = {};
    await aggregateDependencies({
      dappnodeInstaller,
      name: dnpName,
      versionRange,
      dnps,
      dappGetFetcher
    });
    // Clean up after all aggregation steps
    cleanupDnps(dnps);
    expect(dnps).to.deep.equal({
      "dnpA.dnp.dappnode.eth": {
        versions: { "0.1.0": { "dnpB.dnp.dappnode.eth": "^0.1.0" } }
      },
      "dnpB.dnp.dappnode.eth": {
        versions: { "0.1.0": { "dnpC.dnp.dappnode.eth": "^0.1.0" } }
      },
      "dnpC.dnp.dappnode.eth": {
        versions: { "0.1.0": { "dnpA.dnp.dappnode.eth": "^0.1.0" } }
      }
    });
  });

  it("should aggregate only fully resolvable DNPs and skip all with unresolvable dependencies (deep tree)", async () => {
    // This test covers:
    // - A fully resolvable DNP tree
    // - A DNP with a direct dependency that fails to fetch
    // - A DNP with a sub-dependency that fails to fetch
    // - A DNP with a deep sub-dependency that fails to fetch
    // - A DNP with a circular dependency (should not crash)
    const mockDnps: MockDnps = {
      // Fully resolvable
      "good.dnp.dappnode.eth": {
        "1.0.0": { "dep1.dnp.dappnode.eth": "^1.0.0" }
      },
      "dep1.dnp.dappnode.eth": {
        "1.0.0": { "dep2.dnp.dappnode.eth": "^1.0.0" }
      },
      "dep2.dnp.dappnode.eth": {
        "1.0.0": {}
      },
      // Direct dependency fails
      "fail-direct.dnp.dappnode.eth": {
        "1.0.0": { "missing.dnp.dappnode.eth": "^1.0.0" }
      },
      // Sub-dependency fails
      "fail-sub.dnp.dappnode.eth": {
        "1.0.0": { "dep-ok.dnp.dappnode.eth": "^1.0.0" }
      },
      "dep-ok.dnp.dappnode.eth": {
        "1.0.0": { "missing.dnp.dappnode.eth": "^1.0.0" }
      },
      // Deep sub-dependency fails
      "fail-deep.dnp.dappnode.eth": {
        "1.0.0": { "dep-deep1.dnp.dappnode.eth": "^1.0.0" }
      },
      "dep-deep1.dnp.dappnode.eth": {
        "1.0.0": { "dep-deep2.dnp.dappnode.eth": "^1.0.0" }
      },
      "dep-deep2.dnp.dappnode.eth": {
        "1.0.0": { "missing.dnp.dappnode.eth": "^1.0.0" }
      },
      // Circular dependency (should not crash, but is resolvable)
      "circularA.dnp.dappnode.eth": {
        "1.0.0": { "circularB.dnp.dappnode.eth": "^1.0.0" }
      },
      "circularB.dnp.dappnode.eth": {
        "1.0.0": { "circularA.dnp.dappnode.eth": "^1.0.0" }
      },
      // The missing package (will throw)
      "missing.dnp.dappnode.eth": {
        // No versions, will always throw
      }
    };
    // Patch the fetcher to throw for missing.dnp.dappnode.eth
    class DappGetFetcherThrows extends DappGetFetcherMock {
      async dependencies(installer: DappnodeInstallerType, name: string, version: string) {
        if (name === "missing.dnp.dappnode.eth") throw new Error("fetch failed");
        return super.dependencies(installer, name, version);
      }
    }
    const dappGetFetcher = new DappGetFetcherThrows(mockDnps);
    const dnps: DappGetDnps = {};
    // Aggregate all roots
    await aggregateDependencies({
      dappnodeInstaller,
      name: "good.dnp.dappnode.eth",
      versionRange: "1.0.0",
      dnps,
      dappGetFetcher
    });
    await aggregateDependencies({
      dappnodeInstaller,
      name: "fail-direct.dnp.dappnode.eth",
      versionRange: "1.0.0",
      dnps,
      dappGetFetcher
    });
    await aggregateDependencies({
      dappnodeInstaller,
      name: "fail-sub.dnp.dappnode.eth",
      versionRange: "1.0.0",
      dnps,
      dappGetFetcher
    });
    await aggregateDependencies({
      dappnodeInstaller,
      name: "fail-deep.dnp.dappnode.eth",
      versionRange: "1.0.0",
      dnps,
      dappGetFetcher
    });
    await aggregateDependencies({
      dappnodeInstaller,
      name: "circularA.dnp.dappnode.eth",
      versionRange: "1.0.0",
      dnps,
      dappGetFetcher
    });
    // Clean up after all aggregation steps
    cleanupDnps(dnps);
    // Only fully resolvable and circular should remain
    expect(dnps).to.deep.equal({
      "good.dnp.dappnode.eth": {
        versions: {
          "1.0.0": { "dep1.dnp.dappnode.eth": "^1.0.0" }
        }
      },
      "dep1.dnp.dappnode.eth": {
        versions: {
          "1.0.0": { "dep2.dnp.dappnode.eth": "^1.0.0" }
        }
      },
      "dep2.dnp.dappnode.eth": {
        versions: {
          "1.0.0": {}
        }
      },
      "circularA.dnp.dappnode.eth": {
        versions: {
          "1.0.0": { "circularB.dnp.dappnode.eth": "^1.0.0" }
        }
      },
      "circularB.dnp.dappnode.eth": {
        versions: {
          "1.0.0": { "circularA.dnp.dappnode.eth": "^1.0.0" }
        }
      }
    });
  });

  it("should clean up after each aggregation step (intermediate state)", async () => {
    const mockDnps: MockDnps = {
      "root.dnp.dappnode.eth": { "1.0.0": { "fail.dnp.dappnode.eth": "^1.0.0" } },
      "fail.dnp.dappnode.eth": { "1.0.0": { "missing.dnp.dappnode.eth": "^1.0.0" } },
      "missing.dnp.dappnode.eth": {}
    };
    class DappGetFetcherThrows extends DappGetFetcherMock {
      async dependencies(installer: DappnodeInstallerType, name: string, version: string) {
        if (name === "missing.dnp.dappnode.eth") throw new Error("fetch failed");
        return super.dependencies(installer, name, version);
      }
    }
    const dappGetFetcher = new DappGetFetcherThrows(mockDnps);
    const dnps: DappGetDnps = {};
    await aggregateDependencies({
      dappnodeInstaller,
      name: "root.dnp.dappnode.eth",
      versionRange: "1.0.0",
      dnps,
      dappGetFetcher
    });
    // Clean up after all aggregation steps
    cleanupDnps(dnps);
    // After first aggregation, everything should be cleaned up (nothing resolvable)
    expect(dnps).to.deep.equal({});
  });

  it("should handle complex circular graphs", async () => {
    const mockDnps: MockDnps = {
      "A.dnp.dappnode.eth": { "1.0.0": { "B.dnp.dappnode.eth": "^1.0.0" } },
      "B.dnp.dappnode.eth": { "1.0.0": { "C.dnp.dappnode.eth": "^1.0.0" } },
      "C.dnp.dappnode.eth": { "1.0.0": { "A.dnp.dappnode.eth": "^1.0.0", "D.dnp.dappnode.eth": "^1.0.0" } },
      "D.dnp.dappnode.eth": { "1.0.0": { "A.dnp.dappnode.eth": "^1.0.0" } }
    };
    const dappGetFetcher = new DappGetFetcherMock(mockDnps);
    const dnps: DappGetDnps = {};
    await aggregateDependencies({
      dappnodeInstaller,
      name: "A.dnp.dappnode.eth",
      versionRange: "1.0.0",
      dnps,
      dappGetFetcher
    });
    // Clean up after all aggregation steps
    cleanupDnps(dnps);
    expect(dnps).to.deep.equal({
      "A.dnp.dappnode.eth": { versions: { "1.0.0": { "B.dnp.dappnode.eth": "^1.0.0" } } },
      "B.dnp.dappnode.eth": { versions: { "1.0.0": { "C.dnp.dappnode.eth": "^1.0.0" } } },
      "C.dnp.dappnode.eth": { versions: { "1.0.0": { "A.dnp.dappnode.eth": "^1.0.0", "D.dnp.dappnode.eth": "^1.0.0" } } },
      "D.dnp.dappnode.eth": { versions: { "1.0.0": { "A.dnp.dappnode.eth": "^1.0.0" } } }
    });
  });

  it("should not mutate the input mockDnps object", async () => {
    const mockDnps: MockDnps = {
      "immutable.dnp.dappnode.eth": { "1.0.0": {} }
    };
    const original = JSON.stringify(mockDnps);
    const dappGetFetcher = new DappGetFetcherMock(mockDnps);
    const dnps: DappGetDnps = {};
    await aggregateDependencies({
      dappnodeInstaller,
      name: "immutable.dnp.dappnode.eth",
      versionRange: "1.0.0",
      dnps,
      dappGetFetcher
    });
    // Clean up after all aggregation steps
    cleanupDnps(dnps);
    expect(JSON.stringify(mockDnps)).to.equal(original);
  });

  it("should keep only resolvable versions if a DNP has both valid and invalid versions", async () => {
    const mockDnps: MockDnps = {
      "multi.dnp.dappnode.eth": {
        "1.0.0": { "ok.dnp.dappnode.eth": "^1.0.0" },
        "2.0.0": { "fail.dnp.dappnode.eth": "^1.0.0" }
      },
      "ok.dnp.dappnode.eth": { "1.0.0": {} },
      "fail.dnp.dappnode.eth": { "1.0.0": { "missing.dnp.dappnode.eth": "^1.0.0" } },
      "missing.dnp.dappnode.eth": {}
    };
    class DappGetFetcherThrows extends DappGetFetcherMock {
      async dependencies(installer: DappnodeInstallerType, name: string, version: string) {
        if (name === "missing.dnp.dappnode.eth") throw new Error("fetch failed");
        return super.dependencies(installer, name, version);
      }
    }
    const dappGetFetcher = new DappGetFetcherThrows(mockDnps);
    const dnps: DappGetDnps = {};
    await aggregateDependencies({
      dappnodeInstaller,
      name: "multi.dnp.dappnode.eth",
      versionRange: ">=1.0.0",
      dnps,
      dappGetFetcher
    });
    // Clean up after all aggregation steps
    cleanupDnps(dnps);
    expect(dnps).to.deep.equal({
      "multi.dnp.dappnode.eth": { versions: { "1.0.0": { "ok.dnp.dappnode.eth": "^1.0.0" } } },
      "ok.dnp.dappnode.eth": { versions: { "1.0.0": {} } }
    });
  });
});
