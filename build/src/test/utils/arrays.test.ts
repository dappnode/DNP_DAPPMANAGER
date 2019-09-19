import "mocha";
import { expect } from "chai";
import { includesArray } from "../../src/utils/arrays";

describe("Util: arrays", () => {
  describe("includesArray", () => {
    it("Array 2 should include array 1 strings", () => {
      const arr1 = ["admin@0.2.4", "core@0.2.4"];
      const arr2 = ["admin@0.2.4", "core@0.2.4", "vpn@0.2.2"];
      expect(includesArray(arr1, arr2)).to.equal(true);
    });
  });
});
