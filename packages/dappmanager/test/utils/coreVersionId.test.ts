import "mocha";
import { expect } from "chai";

import {
  getCoreVersionId,
  parseCoreVersionId,
  includesArray,
  isVersionIdUpdated
} from "../../src/utils/coreVersionId";

describe("Util: coreVersionId", () => {
  describe("Normal cases", () => {
    const coreDnps: { dnpName: string; version: string }[] = [
      { dnpName: "admin.dnp.dappnode.eth", version: "0.2.6" },
      { dnpName: "vpn.dnp.dappnode.eth", version: "0.2.2" },
      { dnpName: "core.dnp.dappnode.eth", version: "0.2.8" }
    ];
    const versionId = "admin@0.2.6,core@0.2.8,vpn@0.2.2";

    it("Should get a core versionId", async () => {
      expect(getCoreVersionId(coreDnps)).to.equal(versionId);
    });

    it("Should parse a versionId", async () => {
      expect(parseCoreVersionId(versionId)).to.deep.equal(
        coreDnps.sort((a, b) => (a.dnpName > b.dnpName ? 1 : -1))
      );
    });
  });

  describe("Edge cases", () => {
    it("Empty dnps array", async () => {
      const coreDnps: { dnpName: string; version: string }[] = [];
      const versionId = "";
      expect(getCoreVersionId(coreDnps)).to.equal(versionId);
    });

    it("Empty and null versions", async () => {
      const coreDnps: { dnpName: string; version: string }[] = [
        { dnpName: "admin.dnp.dappnode.eth", version: "" },
        { dnpName: "core.dnp.dappnode.eth", version: "" }
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

  describe("isVersionIdUpdated", () => {
    describe("Compare versions encoded", () => {
      const corePkgsPrev = [
        { dnpName: "admin.dnp.dappnode.eth", version: "0.2.0" }
      ];
      const corePkgsNext = [
        { dnpName: "admin.dnp.dappnode.eth", version: "0.2.1" }
      ];

      const versionIdPrev = getCoreVersionId(corePkgsPrev);
      const versionIdNext = getCoreVersionId(corePkgsNext);

      it("prev should NOT be gte next", () => {
        expect(isVersionIdUpdated(versionIdPrev, corePkgsNext)).to.be.false;
      });

      it("next should be gte prev", () => {
        expect(isVersionIdUpdated(versionIdNext, corePkgsPrev)).to.be.true;
      });

      it("next should be gte next", () => {
        expect(isVersionIdUpdated(versionIdNext, corePkgsNext)).to.be.true;
      });
    });

    describe("Compare a subset with a superset", () => {
      const corePkgsSubset = [
        { dnpName: "admin.dnp.dappnode.eth", version: "0.2.0" },
        { dnpName: "core.dnp.dappnode.eth", version: "0.2.0" }
      ];
      const corePkgsSuperset = [
        ...corePkgsSubset,
        { dnpName: "vpn.dnp.dappnode.eth", version: "0.2.0" }
      ];
      const versionIdSubset = getCoreVersionId(corePkgsSubset);
      const versionIdSuperset = getCoreVersionId(corePkgsSuperset);

      it("Should return true for including core version ids", () => {
        expect(isVersionIdUpdated(versionIdSubset, corePkgsSuperset)).to.be
          .true;
      });

      it("Should return false for NOT including core version ids", () => {
        expect(isVersionIdUpdated(versionIdSuperset, corePkgsSubset)).to.be
          .false;
      });
    });
  });
});
