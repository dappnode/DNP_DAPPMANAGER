import { expect } from "chai";
import { getRandomAlphanumericToken } from "../../../src/api/auth/token.js";

describe("utils / token", () => {
  describe("getRandomAlphanumericToken", () => {
    it("Should create a token", () => {
      const len = 20;
      const token = getRandomAlphanumericToken(len);
      expect(token).to.have.length(len);
    });
  });
});
