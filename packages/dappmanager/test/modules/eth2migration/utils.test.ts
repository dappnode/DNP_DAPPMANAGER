import { expect } from "chai";
import { parseValidatorAccounts } from "../../../src/modules/eth2migration/utils";

describe("eth2migration / utils", () => {
  it("Should parse validator accounts list", () => {
    const validatorAccountsData = `[2021-12-15 11:38:36]  WARN flags: Running on Ethereum Consensus Mainnet
(keymanager kind) imported wallet

Showing 2 validator accounts
View the eth1 deposit transaction data for your accounts by running \`validator accounts list --show-deposit-data\`

Account 0 | definitely-evolving-honeybee
[validating public key] 0x80b11b83eb8c1858c657dc55936bd4b47d2418c8906777cecae9c14495796f3d52b44652684e25e9ebb3e9efcfea33c6

Account 1 | implicitly-ultimate-emu
[validating public key] 0x8ac669f5180ae1de36db123114657437fd2cd3f51e838aa327d6739ff28907731462e0832fb9eb190972cfd652b2a775
`;

    const expectedValidatorAccounts =
      "0x80b11b83eb8c1858c657dc55936bd4b47d2418c8906777cecae9c14495796f3d52b44652684e25e9ebb3e9efcfea33c6,0x8ac669f5180ae1de36db123114657437fd2cd3f51e838aa327d6739ff28907731462e0832fb9eb190972cfd652b2a775";

    expect(parseValidatorAccounts(validatorAccountsData)).to.deep.equal(
      expectedValidatorAccounts
    );
  });
});
