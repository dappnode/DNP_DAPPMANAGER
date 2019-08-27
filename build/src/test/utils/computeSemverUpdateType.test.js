const expect = require("chai").expect;
const computeSemverUpdateType = require("utils/computeSemverUpdateType");

describe("Util: computeSemverUpdateType", () => {
  it("Should flag update types correctly", async () => {
    const updates = [
      // Major
      { result: "major", from: "0.2.0", to: "1.0.0" },
      // Minor
      { result: "minor", from: "0.2.0", to: "0.3.0" },
      // Patch
      { result: "patch", from: "0.2.0", to: "0.2.4" },
      // Same version
      { result: undefined, from: "0.2.0", to: "0.2.0" },
      // Downgrade
      { result: undefined, from: "0.2.0", to: "0.1.8" },
      // Incorrect from
      { result: undefined, from: "/ipfs/asudbqbwif", to: "0.1.8" },
      // Incorrect to
      { result: undefined, from: "0.2.0", to: "/ipfs/asudbqbwif" }
    ];

    for (const { from, to, result } of updates) {
      expect(computeSemverUpdateType(from, to)).to.equal(
        result,
        `from ${from} to ${to} should be ${result}`
      );
    }
  });
});
