import "mocha";
import { expect } from "chai";
import {
  parseBrainValidatorsResponseToIndices,
  diffIndices,
  indicesAreEqual
} from "../../src/utils.js";
import { BrainValidatorsResponse } from "../../src/types.js";

describe("dashboardServer > utils", () => {
  describe("parseBrainValidatorsResponseToIndices", () => {
    it("should return empty array for null response", () => {
      const result = parseBrainValidatorsResponseToIndices(null);
      expect(result.indices).to.deep.equal([]);
      expect(result.invalidCount).to.equal(0);
    });

    it("should return empty array for empty object", () => {
      const result = parseBrainValidatorsResponseToIndices({});
      expect(result.indices).to.deep.equal([]);
      expect(result.invalidCount).to.equal(0);
    });

    it("should parse single tag with valid indices", () => {
      const response: BrainValidatorsResponse = {
        solo: ["123", "456", "789"]
      };
      const result = parseBrainValidatorsResponseToIndices(response);
      expect(result.indices).to.deep.equal([123, 456, 789]);
      expect(result.invalidCount).to.equal(0);
    });

    it("should merge and deduplicate indices from multiple tags", () => {
      const response: BrainValidatorsResponse = {
        lido: ["12345", "67890"],
        solo: ["111", "12345"] // 12345 is duplicated
      };
      const result = parseBrainValidatorsResponseToIndices(response);
      expect(result.indices).to.deep.equal([111, 12345, 67890]);
      expect(result.invalidCount).to.equal(0);
    });

    it("should sort indices numerically", () => {
      const response: BrainValidatorsResponse = {
        tag: ["1000", "10", "100", "1"]
      };
      const result = parseBrainValidatorsResponseToIndices(response);
      expect(result.indices).to.deep.equal([1, 10, 100, 1000]);
    });

    it("should skip invalid indices and count them", () => {
      const response: BrainValidatorsResponse = {
        tag: ["123", "invalid", "-1", "456", "NaN", ""]
      };
      const result = parseBrainValidatorsResponseToIndices(response);
      expect(result.indices).to.deep.equal([123, 456]);
      expect(result.invalidCount).to.equal(4); // "invalid", "-1", "NaN", ""
    });

    it("should parse decimal strings using parseInt (truncates to integer)", () => {
      // parseInt("3.14") returns 3, which is a valid integer
      const response: BrainValidatorsResponse = {
        tag: ["3.14", "10.99"]
      };
      const result = parseBrainValidatorsResponseToIndices(response);
      expect(result.indices).to.deep.equal([3, 10]);
      expect(result.invalidCount).to.equal(0);
    });

    it("should handle large indices", () => {
      const response: BrainValidatorsResponse = {
        tag: ["999999999", "1"]
      };
      const result = parseBrainValidatorsResponseToIndices(response);
      expect(result.indices).to.deep.equal([1, 999999999]);
    });
  });

  describe("diffIndices", () => {
    it("should detect no change when arrays are equal", () => {
      const diff = diffIndices([1, 2, 3], [1, 2, 3]);
      expect(diff.hasChanged).to.be.false;
      expect(diff.added).to.deep.equal([]);
      expect(diff.removed).to.deep.equal([]);
      expect(diff.oldCount).to.equal(3);
      expect(diff.newCount).to.equal(3);
    });

    it("should detect added indices", () => {
      const diff = diffIndices([1, 2], [1, 2, 3, 4]);
      expect(diff.hasChanged).to.be.true;
      expect(diff.added).to.deep.equal([3, 4]);
      expect(diff.removed).to.deep.equal([]);
      expect(diff.oldCount).to.equal(2);
      expect(diff.newCount).to.equal(4);
    });

    it("should detect removed indices", () => {
      const diff = diffIndices([1, 2, 3, 4], [1, 2]);
      expect(diff.hasChanged).to.be.true;
      expect(diff.added).to.deep.equal([]);
      expect(diff.removed).to.deep.equal([3, 4]);
      expect(diff.oldCount).to.equal(4);
      expect(diff.newCount).to.equal(2);
    });

    it("should detect both added and removed indices", () => {
      const diff = diffIndices([1, 2, 3], [2, 3, 4, 5]);
      expect(diff.hasChanged).to.be.true;
      expect(diff.added).to.deep.equal([4, 5]);
      expect(diff.removed).to.deep.equal([1]);
    });

    it("should handle null old indices (first run)", () => {
      const diff = diffIndices(null, [1, 2, 3]);
      expect(diff.hasChanged).to.be.true;
      expect(diff.added).to.deep.equal([1, 2, 3]);
      expect(diff.removed).to.deep.equal([]);
      expect(diff.oldCount).to.equal(0);
      expect(diff.newCount).to.equal(3);
    });

    it("should handle empty new array", () => {
      const diff = diffIndices([1, 2, 3], []);
      expect(diff.hasChanged).to.be.true;
      expect(diff.added).to.deep.equal([]);
      expect(diff.removed).to.deep.equal([1, 2, 3]);
    });

    it("should handle completely different sets", () => {
      const diff = diffIndices([1, 2, 3], [4, 5, 6]);
      expect(diff.hasChanged).to.be.true;
      expect(diff.added).to.deep.equal([4, 5, 6]);
      expect(diff.removed).to.deep.equal([1, 2, 3]);
    });
  });

  describe("indicesAreEqual", () => {
    it("should return true for identical arrays", () => {
      expect(indicesAreEqual([1, 2, 3], [1, 2, 3])).to.be.true;
    });

    it("should return true for empty arrays", () => {
      expect(indicesAreEqual([], [])).to.be.true;
    });

    it("should return false for different lengths", () => {
      expect(indicesAreEqual([1, 2], [1, 2, 3])).to.be.false;
    });

    it("should return false for different values", () => {
      expect(indicesAreEqual([1, 2, 3], [1, 2, 4])).to.be.false;
    });

    it("should return false for same values in different order", () => {
      // Note: This function expects sorted arrays
      expect(indicesAreEqual([1, 2, 3], [3, 2, 1])).to.be.false;
    });
  });
});
