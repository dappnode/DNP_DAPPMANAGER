import "mocha";
import { expect } from "chai";
import { ethers } from "ethers";
import {
  prepareMessageFromPackage,
  signDataFromPackage,
  hashMessage
} from "../../../src/utils/sign";

describe("Util / sign", () => {
  describe("prepareMessageFromPackage", () => {
    it("Should concat message to sign", () => {
      const packageEnsName = "test.dnp.dappnode.eth";
      const data = "1607077255674";

      const message = prepareMessageFromPackage({ packageEnsName, data });

      expect(message).to.equal(
        `
\x1dDappnode Signed Message:
test.dnp.dappnode.eth
13
1607077255674
      `.trim()
      );
    });
  });

  describe("signDataFromPackage", () => {
    it("Should sign data from package", () => {
      const wallet = ethers.Wallet.createRandom();

      const packageEnsName = "test.dnp.dappnode.eth";
      const data = "1607077255674";

      const signature = signDataFromPackage({
        privateKey: wallet.privateKey,
        packageEnsName,
        data
      });

      expect(signature, "Signature not OK").to.be.ok;

      // Simulate sending payload over the wire
      // This code should run on the signature consumer

      const message = prepareMessageFromPackage({ packageEnsName, data });
      const digest = hashMessage(message);
      const address = ethers.utils.recoverAddress(digest, signature);

      expect(address).to.deep.equal(
        wallet.address,
        "Recovered address does not match"
      );
    });
  });
});
