import "mocha";
import { expect } from "chai";
import { getCoreVersionId, parseCoreVersionId, isVersionIdUpdated } from "../../src/coreVersionId.js";

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
      expect(parseCoreVersionId(versionId)).to.deep.equal(coreDnps.sort((a, b) => (a.dnpName > b.dnpName ? 1 : -1)));
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

  describe("isVersionIdUpdated", () => {
    describe("Compare versions encoded", () => {
      const dnpName = "admin.dnp.dappnode.eth";
      const corePkgs = [{ dnpName, version: "0.2.0" }];
      const versionIdPrev = getCoreVersionId([{ dnpName, version: "0.1.9" }]);
      const versionIdSame = getCoreVersionId([{ dnpName, version: "0.2.0" }]);
      const versionIdNext = getCoreVersionId([{ dnpName, version: "0.2.1" }]);

      it("previous version than current = updated", () => {
        expect(isVersionIdUpdated(versionIdPrev, corePkgs)).to.equal(true);
      });

      it("same version as current = updated", () => {
        expect(isVersionIdUpdated(versionIdSame, corePkgs)).to.equal(true);
      });

      it("higher version than current = NOT updated", () => {
        expect(isVersionIdUpdated(versionIdNext, corePkgs)).to.equal(false);
      });
    });

    describe("Compare a subset with a superset", () => {
      const corePkgsSubset = [
        { dnpName: "admin.dnp.dappnode.eth", version: "0.2.0" },
        { dnpName: "core.dnp.dappnode.eth", version: "0.2.0" }
      ];
      const corePkgsSuperset = [...corePkgsSubset, { dnpName: "vpn.dnp.dappnode.eth", version: "0.2.0" }];
      const versionIdSubset = getCoreVersionId(corePkgsSubset);
      const versionIdSuperset = getCoreVersionId(corePkgsSuperset);

      it("Should return true for including core version ids", () => {
        expect(isVersionIdUpdated(versionIdSubset, corePkgsSuperset)).to.be.true;
      });

      it("Should return false for NOT including core version ids", () => {
        expect(isVersionIdUpdated(versionIdSuperset, corePkgsSubset)).to.be.false;
      });
    });
  });
});
