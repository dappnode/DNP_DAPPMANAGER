import "mocha";
import { expect } from "chai";

import { prettyDnpName } from "../../../src/utils/format.js";

describe("Util / format", () => {
  describe("prettyDnpName", () => {
    const cases: { [dnpName: string]: string } = {
      "goerli-geth.public.dappnode.eth": "Goerli Geth",
      "nethermind.public.dappnode.eth": "Nethermind",
      "prysm-beacon-chain.public.dappnode.eth": "Prysm Beacon Chain",
      "bitcoin.dnp.dappnode.eth": "Bitcoin",
      "package0-1-2.public.dappnode.eth": "Package0 1 2"
    };

    for (const dnpName of Object.keys(cases)) {
      it(`should get a prettyDnpName for ${dnpName}`, () => {
        expect(prettyDnpName(dnpName)).to.equal(cases[dnpName]);
      });
    }
  });
});
