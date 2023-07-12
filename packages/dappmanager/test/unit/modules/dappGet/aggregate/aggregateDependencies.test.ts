import "mocha";
import { expect } from "chai";
import { DappGetFetcherMock, MockDnps } from "../testHelpers.js";
import aggregateDependencies from "../../../../../src/modules/dappGet/aggregate/aggregateDependencies.js";

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
});
