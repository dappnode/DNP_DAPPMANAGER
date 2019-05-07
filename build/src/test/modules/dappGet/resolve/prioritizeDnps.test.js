const proxyquire = require("proxyquire");
const expect = require("chai").expect;

/**
 * Purpose of the test. Make sure the DNPs are ordered correctly
 *
 * Rules to prioritize DNPs:
 * 1. Requested package, newest first
 * 2. State package, oldest first
 * 3. New packages, newest first.
 * + Prioritize not installing new packages, first version = null.
 */

const prioritizeDnps = proxyquire("modules/dappGet/resolve/prioritizeDnps", {});

describe("dappGet/resolve/prioritizeDnps", () => {
  it("should order dnps: Others > state > request", async () => {
    const dnps = {
      A: { isRequest: true, versions: [] },
      B: { isInstalled: true, versions: [] },
      C: { isInstalled: true, versions: [] },
      D: { versions: [] },
      E: { versions: [] }
    };
    const dnpsArray = prioritizeDnps(dnps);
    expect(dnpsArray).to.deep.equal([
      { name: "D", versions: [] },
      { name: "E", versions: [] },
      { name: "B", isInstalled: true, versions: [] },
      { name: "C", isInstalled: true, versions: [] },
      { name: "A", isRequest: true, versions: [] }
    ]);
  });
});
