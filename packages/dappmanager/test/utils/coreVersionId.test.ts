import "mocha";
import { expect } from "chai";

import {
  getCoreVersionId,
  parseCoreVersionId,
  includesArray,
  areCoreVersionIdsIncluded
} from "../../src/utils/coreVersionId";

describe("Util: coreVersionId", () => {
  describe("Normal cases", () => {
    const coreDnps: { name: string; version: string }[] = [
      { name: "admin.dnp.dappnode.eth", version: "0.2.6" },
      { name: "vpn.dnp.dappnode.eth", version: "0.2.2" },
      { name: "core.dnp.dappnode.eth", version: "0.2.8" }
    ];
    const versionId = "admin@0.2.6,core@0.2.8,vpn@0.2.2";

    it("Should get a core versionId", async () => {
      expect(getCoreVersionId(coreDnps)).to.equal(versionId);
    });

    it("Should parse a versionId", async () => {
      expect(parseCoreVersionId(versionId)).to.deep.equal(
        coreDnps.sort((a, b) => (a.name > b.name ? 1 : -1))
      );
    });
  });

  describe("Edge cases", () => {
    it("Empty dnps array", async () => {
      const coreDnps: { name: string; version: string }[] = [];
      const versionId = "";
      expect(getCoreVersionId(coreDnps)).to.equal(versionId);
    });

    it("Empty and null versions", async () => {
      const coreDnps: { name: string; version: string }[] = [
        { name: "admin.dnp.dappnode.eth", version: "" },
        { name: "core.dnp.dappnode.eth", version: "" }
      ];
      const versionId = "";
      expect(getCoreVersionId(coreDnps)).to.equal(versionId);
    });
  });

  describe("includesArray", () => {
    it("Array 2 should include array 1 strings", () => {
      const arr1 = ["admin@0.2.4", "core@0.2.4"];
      const arr2 = ["admin@0.2.4", "core@0.2.4", "vpn@0.2.2"];
      expect(includesArray(arr1, arr2)).to.equal(true);
    });
  });

  describe("areCoreVersionIdsIncluded", () => {
    const coreVersionSubset: { name: string; version: string }[] = [
      { name: "admin.dnp.dappnode.eth", version: "0.2.6" },
      { name: "core.dnp.dappnode.eth", version: "0.2.8" }
    ];
    const coreVersionSuperset: { name: string; version: string }[] = [
      ...coreVersionSubset,
      { name: "vpn.dnp.dappnode.eth", version: "0.2.2" }
    ];
    const coreVersionIdSubset = getCoreVersionId(coreVersionSubset);
    const coreVersionIdSuperset = getCoreVersionId(coreVersionSuperset);

    it("Should return true for including core version ids", () => {
      expect(
        areCoreVersionIdsIncluded(coreVersionIdSubset, coreVersionIdSuperset)
      ).to.be.true;
    });

    it("Should return false for NOT including core version ids", () => {
      expect(
        areCoreVersionIdsIncluded(coreVersionIdSuperset, coreVersionIdSubset)
      ).to.be.false;
    });
  });
});
