import "mocha";
import { expect } from "chai";

import { shortNameDomain } from "../../src/utils/format";

describe("Util: format", () => {
  describe("shortNameDomain", () => {
    const cases: { [dnpName: string]: string } = {
      "goerli-geth.public.dappnode.eth": "goerli-geth-public",
      "nethermind.public.dappnode.eth": "nethermind-public",
      "prysm-beacon-chain.public.dappnode.eth": "prysm-beacon-chain-public",
      "bitcoin.dnp.dappnode.eth": "bitcoin",
      "package0-1-2.public.dappnode.eth": "package-public"
    };

    for (const dnpName of Object.keys(cases)) {
      it(`should get shortName domain for dnpName ${dnpName}`, () => {
        expect(shortNameDomain(dnpName)).to.equal(cases[dnpName]);
      });
    }
  });
});
