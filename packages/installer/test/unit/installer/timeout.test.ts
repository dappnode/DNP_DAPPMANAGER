import "mocha";
import { expect } from "chai";
import { parseTimeoutSeconds } from "../../../src/utils.js";

describe("Util: timeout", () => {
  it("It should parse string parameter to number", () => {
    const str = "20min"; // 1200 seconds
    expect(parseTimeoutSeconds(str)).to.equal(1200);
  });

  it("It should return undefined timeout when the given parameter is undefined", () => {
    expect(parseTimeoutSeconds(undefined)).to.equal(undefined);
  });

  it("It should return number timeout when the given parameter is number", () => {
    expect(parseTimeoutSeconds(1)).to.equal(1);
  });
});
