import "mocha";
import { expect } from "chai";

import {
  getCoreVersionId,
  parseCoreVersionId
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
});
