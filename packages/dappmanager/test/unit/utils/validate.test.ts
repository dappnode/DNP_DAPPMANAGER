import "mocha";
import { expect } from "chai";
import { mockHash } from "../../testUtils";
import { isIpfsHash, isSemverRange } from "../../../src/utils/validate";

describe("Util > validate", () => {
  describe("isIpfsHash", () => {
    const validHashes = [
      mockHash,
      "/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme",
      "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme",
      "/ipfs/QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB",
      "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB"
    ];

    for (const hash of validHashes) {
      it(`valid hash ${hash}`, () => {
        expect(isIpfsHash(hash)).to.equal(true);
      });
    }
  });

  describe("isSemverRange", () => {
    it("should return true for a regular semver", () => {
      expect(isSemverRange("0.1.2")).to.equal(true);
    });
    it("should return true for a '*' semver", () => {
      expect(isSemverRange("*")).to.equal(true);
    });
    it("should return true for a semver range", () => {
      expect(isSemverRange("^0.1.2")).to.equal(true);
    });
    it("should return false for an IPFS range", () => {
      expect(isSemverRange("/ipfs/Qmasbjdbkajbdkjwbkjfbakjsf")).to.equal(false);
    });
    it("should return false for random nonsense", () => {
      expect(isSemverRange("asjd")).to.equal(false);
    });
  });
});
