import "mocha";
import { expect } from "chai";

/**
 * Purpose of the test. Make sure the DNPs are ordered correctly
 *
 * Rules to prioritize DNPs:
 * 1. Requested package, newest first
 * 2. State package, oldest first
 * 3. New packages, newest first.
 * + Prioritize not installing new packages, first version = null.
 */

import prioritizeDnps from "../../../../../src/modules/dappGet/resolve/prioritizeDnps.js";

describe.skip("dappGet/resolve/prioritizeDnps", () => {
  it("should order dnps: Others > state > request", async () => {
    const dnps = {
      A: { isRequest: true, versions: {} },
      B: { isInstalled: true, versions: {} },
      C: { isInstalled: true, versions: {} },
      D: { versions: {} },
      E: { versions: {} }
    };
    const dnpsArray = prioritizeDnps(dnps);
    expect(dnpsArray).to.deep.equal([
      { name: "D", versions: {} },
      { name: "E", versions: {} },
      { name: "B", isInstalled: true, versions: {} },
      { name: "C", isInstalled: true, versions: {} },
      { name: "A", isRequest: true, versions: {} }
    ]);
  });
});
