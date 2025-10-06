import "mocha";
import { expect } from "chai";
import { DappGetFetcherMock, MockDnps } from "../testHelpers.js";
import { Dependencies } from "@dappnode/types";
import { DappnodeInstaller } from "../../../../src/dappnodeInstaller.js";
import aggregateDependencies from "../../../../src/dappGet/aggregate/aggregateDependencies.js";
import { dappnodeInstaller } from "../../../testUtils.js";

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
    const dnps = {};
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
    const dnps = {};
    await aggregateDependencies({
      dappnodeInstaller,
      name: dnpName,
      versionRange,
      dnps,
      dappGetFetcher
    });

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

  it("should skip versions whose dependencies can't be fetched", async () => {
    // Create a mock fetcher that fails for specific versions
    class DappGetFetcherWithFailures extends DappGetFetcherMock {
      async dependencies(dappnodeInstaller: DappnodeInstaller, name: string, version: string): Promise<Dependencies> {
        // Simulate failure for specific version
        if (name === "kovan.dnp.dappnode.eth" && version === "0.1.1") {
          throw new Error(`Failed to fetch dependencies for ${name}@${version}`);
        }
        return super.dependencies(dappnodeInstaller, name, version);
      }
    }

    const mockDnps: MockDnps = {
      "kovan.dnp.dappnode.eth": {
        "0.1.0": { "dependency.dnp.dappnode.eth": "^0.1.1" },
        "0.1.1": { "dependency.dnp.dappnode.eth": "^0.1.1" }, // This will fail
        "0.1.2": { "dependency.dnp.dappnode.eth": "^0.1.1" }
      },
      "dependency.dnp.dappnode.eth": {
        "0.1.1": {},
        "0.1.2": {}
      }
    };

    const dappGetFetcher = new DappGetFetcherWithFailures(mockDnps);

    const dnpName = "kovan.dnp.dappnode.eth";
    const versionRange = "^0.1.0"; // This will match multiple versions
    const dnps = {};
    
    // This should not throw an error despite version 0.1.1 failing
    await aggregateDependencies({
      dappnodeInstaller,
      name: dnpName,
      versionRange,
      dnps,
      dappGetFetcher
    });

    // Should only contain versions 0.1.0 and 0.1.2 (0.1.1 should be skipped due to fetch failure)
    expect(dnps).to.deep.equal({
      "kovan.dnp.dappnode.eth": {
        versions: {
          "0.1.0": { "dependency.dnp.dappnode.eth": "^0.1.1" },
          "0.1.2": { "dependency.dnp.dappnode.eth": "^0.1.1" }
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

  it("should handle case where all versions fail to fetch dependencies", async () => {
    // Create a mock fetcher that fails for all versions of a specific package
    class DappGetFetcherWithAllFailures extends DappGetFetcherMock {
      async dependencies(dappnodeInstaller: DappnodeInstaller, name: string, version: string): Promise<Dependencies> {
        // Simulate failure for all versions of this specific package
        if (name === "broken.dnp.dappnode.eth") {
          throw new Error(`Failed to fetch dependencies for ${name}@${version}`);
        }
        return super.dependencies(dappnodeInstaller, name, version);
      }
    }

    const mockDnps: MockDnps = {
      "broken.dnp.dappnode.eth": {
        "0.1.0": { "dependency.dnp.dappnode.eth": "^0.1.1" }, // This will fail
        "0.1.1": { "dependency.dnp.dappnode.eth": "^0.1.1" }, // This will fail
        "0.1.2": { "dependency.dnp.dappnode.eth": "^0.1.1" }  // This will fail
      },
      "dependency.dnp.dappnode.eth": {
        "0.1.1": {},
        "0.1.2": {}
      }
    };

    const dappGetFetcher = new DappGetFetcherWithAllFailures(mockDnps);

    const dnpName = "broken.dnp.dappnode.eth";
    const versionRange = "^0.1.0"; // This will match multiple versions but all will fail
    const dnps = {};
    
    // This should not throw an error despite all versions failing
    await aggregateDependencies({
      dappnodeInstaller,
      name: dnpName,
      versionRange,
      dnps,
      dappGetFetcher
    });

    // Should be empty since all versions failed to fetch dependencies
    expect(dnps).to.deep.equal({});
  });
});
