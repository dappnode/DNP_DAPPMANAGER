import "mocha";
import { expect } from "chai";
import { mockHash } from "../testUtils";
import isIpfsHash from "../../src/utils/isIpfsHash";

describe("Util: is X", () => {
  describe("isIpfsHash", () => {
    it("Mock ipfs hash should be a valid hash", () => {
      expect(isIpfsHash(mockHash)).to.equal(true);
    });
  });
});
