const expect = require("chai").expect;
const { uniqueValues, includesArray } = require("utils/arrays");

describe("Util: arrays", () => {
  describe("includesArray", () => {
    it("Array 2 should include array 1 strings", () => {
      const arr1 = ["admin@0.2.4", "core@0.2.4"];
      const arr2 = ["admin@0.2.4", "core@0.2.4", "vpn@0.2.2"];
      expect(includesArray(arr1, arr2)).to.equal(true);
    });
  });

  describe("uniqueValues", () => {
    it("Should remove duplicated items", () => {
      const arr = ["admin@0.2.6", "core@0.2.8", "vpn@0.2.2"];
      expect(uniqueValues([...arr, ...arr, ...arr])).to.deep.equal(arr);
    });
  });
});
