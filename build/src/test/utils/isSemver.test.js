const expect = require("chai").expect;

const isSemverRange = require("utils/isSemverRange");

describe("Utils > isSemverRange", () => {
  it("should return true for a regular semver", () => {
    expect(isSemverRange("0.1.2")).to.equal(true);
  });
  it("should return true for a '*' semver", () => {
    expect(isSemverRange("*")).to.equal(true);
  });
  it("should return true for a semver range", () => {
    expect(isSemverRange("^0.1.2")).to.equal(true);
  });
  it("should return false for an IPFS range", () => {
    expect(isSemverRange("/ipfs/Qmasbjdbkajbdkjwbkjfbakjsf")).to.equal(false);
  });
  it("should return false for random nonsense", () => {
    expect(isSemverRange("asjd")).to.equal(false);
  });
});
