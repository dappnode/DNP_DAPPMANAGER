import "mocha";
import { expect } from "chai";

import { parseCredentialsFromEnvs } from "../../../../src/modules/chains/drivers/bitcoin";

describe("Watchers > chains > bitcoin", () => {
  describe("parseCredentialsFromEnvs", () => {
    it("Should parse bitcoin envs", () => {
      const envRows = [
        "BTC_RPCUSER=dappnode",
        "BTC_RPCPASSWORD=dappnode",
        "BTC_TXINDEX=1",
        "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
      ];
      expect(parseCredentialsFromEnvs(envRows)).to.deep.equal({
        username: "dappnode",
        password: "dappnode",
        port: null
      });
    });

    it("Should parse zcash envs", () => {
      const envRows = [
        "ZCASH_RPCUSER=dappnode",
        "ZCASH_RPCPASSWORD=dappnode",
        "ZCASH_RPCPORT=8342",
        "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
      ];
      expect(parseCredentialsFromEnvs(envRows)).to.deep.equal({
        username: "dappnode",
        password: "dappnode",
        port: 8342
      });
    });
  });
});
