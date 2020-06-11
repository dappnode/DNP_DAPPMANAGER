import "mocha";
import { expect } from "chai";

import {
  parseCredentialsFromEnvs,
  getContainerNameFromApi
} from "../../../src/watchers/chains/drivers/bitcoin";

describe("Watchers > chains > bitcoin", () => {
  describe("parseCredentialsFromEnvs", () => {
    it("Should parse bitcoin envs", () => {
      const envLine =
        "[BTC_RPCUSER=dappnode BTC_RPCPASSWORD=dappnode BTC_TXINDEX=1 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin]";
      expect(parseCredentialsFromEnvs(envLine)).to.deep.equal({
        username: "dappnode",
        password: "dappnode",
        port: null
      });
    });

    it("Should parse zcash envs", () => {
      const envLine =
        "[ZCASH_RPCUSER=dappnode ZCASH_RPCPASSWORD=dappnode ZCASH_RPCPORT=8342 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin]";
      expect(parseCredentialsFromEnvs(envLine)).to.deep.equal({
        username: "dappnode",
        password: "dappnode",
        port: 8342
      });
    });
  });
  describe("getContainerNameFromApi", () => {
    it("Should return correct container name for bitcoin", () => {
      expect(getContainerNameFromApi("my.bitcoin.dnp.dappnode.eth")).to.equal(
        "DAppNodePackage-bitcoin.dnp.dappnode.eth"
      );
    });

    it("Should return correct container name for zcash", () => {
      expect(getContainerNameFromApi("my.zcash.dnp.dappnode.eth")).to.equal(
        "DAppNodePackage-zcash.dnp.dappnode.eth"
      );
    });

    it("Should return correct container name", () => {
      expect(function() {
        getContainerNameFromApi("http://bitcoin.dappnode");
      }).to.throw("Expected API format my.<dnpName>");
    });
  });
});
