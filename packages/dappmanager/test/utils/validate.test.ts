import "mocha";
import { expect } from "chai";
import { mockHash } from "../testUtils";
import { isIpfsHash, isSemverRange } from "../../src/utils/validate";

describe("Util > validate", () => {
  describe("isIpfsHash", () => {
    it("Mock ipfs hash should be a valid hash", () => {
      expect(isIpfsHash(mockHash)).to.equal(true);
    });
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
