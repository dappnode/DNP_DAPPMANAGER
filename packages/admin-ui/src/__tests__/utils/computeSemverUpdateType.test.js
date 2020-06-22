import computeSemverUpdateType from "../../utils/computeSemverUpdateType";

describe("utils > computeSemverUpdateType", () => {
  it("Should deal with invalid versions", () => {
    const cases = [
      { from: "/ipfs/Amasjdnja", to: "0.2.2" },
      { from: "/ipfs/Amasjdnja", to: "/ipfs/Amasjdnja" },
      { from: "0.2.2", to: "/ipfs/Amasjdnja" },
      { from: "0.2.2", to: null },
      { from: null, to: "/ipfs/Amasjdnja" }
    ];
    for (const { from, to } of cases) {
      expect(computeSemverUpdateType(from, to)).toEqual(null);
    }
  });

  it("Should detect downgrades", () => {
    const cases = [
      { from: "0.3.0", to: "0.2.2" },
      { from: "1.0.0", to: "0.9.1" },
      { from: "0.2.2", to: "0.2.1" }
    ];
    for (const { from, to } of cases) {
      expect(computeSemverUpdateType(from, to)).toEqual("downgrade");
    }
  });

  it("Should detect different types of major", () => {
    const cases = [
      { from: "0.0.1", to: "0.0.2" },
      { from: "0.1.2", to: "0.2.1" },
      { from: "1.2.3", to: "2.1.2" }
    ];
    for (const { from, to } of cases) {
      expect(computeSemverUpdateType(from, to)).toEqual("major");
    }
  });

  it("Should detect different types of minor", () => {
    const cases = [
      { from: "0.1.2", to: "0.1.3" },
      { from: "1.2.3", to: "1.3.2" }
    ];
    for (const { from, to } of cases) {
      expect(computeSemverUpdateType(from, to)).toEqual("minor");
    }
  });

  it("Should detect different types of patch", () => {
    const cases = [{ from: "1.2.3", to: "1.2.4" }];
    for (const { from, to } of cases) {
      expect(computeSemverUpdateType(from, to)).toEqual("patch");
    }
  });
});
