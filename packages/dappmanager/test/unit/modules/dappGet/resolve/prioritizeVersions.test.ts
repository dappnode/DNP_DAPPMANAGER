import "mocha";
import { expect } from "chai";

/**
 * Purpose of the test. Make sure the versions are ordered correctly
 *
 * Rules to prioritize versions:
 * 1. Requested package, newest first
 * 2. State package, oldest first
 * 3. New packages, newest first.
 * + Prioritize not installing new packages, first version = null.
 */

import prioritizeVersions from "../../../../../src/modules/dappGet/resolve/prioritizeVersions";

describe.skip("dappGet/resolve/prioritizeVersions", () => {
  it("should order versions: requested DNP. Prioritize newer versions", async () => {
    const dnp = {
      isRequest: true,
      versions: { "0.1.0": {}, "0.1.1": {} }
    };
    const versions = prioritizeVersions(dnp);
    expect(versions).to.deep.equal(["0.1.1", "0.1.0"]);
  });

  it("should deal with non-semver versions and prioritize them", async () => {
    const dnp = {
      isRequest: true,
      versions: {
        "0.1.0": {},
        "0.1.1": {},
        "/ipfs/QmbPVaVVLHoFyJyzxHmok9kJYFAzq6R2UBvhEAuAQYc3ws": {}
      }
    };
    const versions = prioritizeVersions(dnp);
    expect(versions).to.deep.equal([
      "/ipfs/QmbPVaVVLHoFyJyzxHmok9kJYFAzq6R2UBvhEAuAQYc3ws",
      "0.1.1",
      "0.1.0"
    ]);
  });

  it("should order versions: state DNP. Prioritize older versions", async () => {
    const dnp = {
      isInstalled: true,
      versions: { "0.1.0": {}, "0.1.1": {} }
    };
    const versions = prioritizeVersions(dnp);
    expect(versions).to.deep.equal(["0.1.0", "0.1.1"]);
  });

  it("should order versions: not installed DNP. Prioritize newer versions + null", async () => {
    const dnp = {
      versions: { "0.1.0": {}, "0.1.1": {} }
    };
    const versions = prioritizeVersions(dnp);
    expect(versions).to.deep.equal([null, "0.1.1", "0.1.0"]);
  });
});
