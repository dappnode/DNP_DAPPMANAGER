import "mocha";
import { expect } from "chai";
import * as calls from "../../src/calls.js";
import { clearDbs } from "../testUtils.js";

describe("Fetch external data", () => {
  before("Clear DBs and set remote", async () => {
    clearDbs();
    // Activate remote and fallback to fetch test data without a local node
    await calls.ethClientFallbackSet({ fallback: "on" });
    await calls.ethClientTargetSet({ target: "remote" });
  });

  const bindId = "bind.dnp.dappnode.eth";
  const bitcoinId = "bitcoin.dnp.dappnode.eth";

  describe("fetchCoreUpdateData", () => {
    it("Should fetch core update data", async () => {
      const result = await calls.fetchCoreUpdateData({});
      if (!result.available) {
        throw Error("Core update should be available");
      }
      const dnpBind = result.packages.find(({ name }) => name === bindId);
      expect(dnpBind, "Bind DNP must be in packages array").to.be.ok;
    });
  });

  describe("fetchDirectory", () => {
    it("Should fetch directory data", async () => {
      const directoryDnps = await calls.fetchDirectory();
      expect(directoryDnps).to.have.length.greaterThan(
        0,
        "There should be packages in the directory return"
      );
      // Make sure the bitcoin DNP is there
      const dnpBitcoin = directoryDnps.find(({ name }) => name === bitcoinId);
      expect(dnpBitcoin, "Bitcoin DNP should be in directory array").to.be.ok;

      // Make sure that if there's a featured package it's first
      const isThereFeatured = directoryDnps.some(dnp => dnp.isFeatured);
      if (isThereFeatured) {
        expect(
          directoryDnps[0].isFeatured,
          "Wrong order: first package should be featured"
        ).to.be.true;
      }
    });
  });
});
