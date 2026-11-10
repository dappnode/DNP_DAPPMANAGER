import "mocha";
import { expect } from "chai";
import { parseTimeoutSeconds } from "../../../src/utils.js";

describe("Util: timeout", () => {
  it("It should parse string parameter to number", () => {
    const str = "20min"; // 1200 seconds
    expect(parseTimeoutSeconds(str)).to.equal(1200);
  });

  it("It should parse a numeric string as seconds", () => {
    expect(parseTimeoutSeconds("5")).to.equal(5);
    expect(parseTimeoutSeconds("300")).to.equal(300);
    expect(parseTimeoutSeconds(" 300 ")).to.equal(300);
  });

  it("It should throw on unitless numbers that are not whole seconds", () => {
    for (const str of ["1.5", "-5", "+5"]) {
      expect(() => parseTimeoutSeconds(str), str).to.throw("Error parsing timeout");
    }
  });

  it("It should keep parsing strings with units", () => {
    expect(parseTimeoutSeconds("300s")).to.equal(300);
    expect(parseTimeoutSeconds("1h30m")).to.equal(5400);
    expect(parseTimeoutSeconds("2.5min")).to.equal(150);
  });

  it("It should throw on unparseable strings", () => {
    expect(() => parseTimeoutSeconds("abc")).to.throw();
  });

  it("It should return undefined timeout when the given parameter is an empty string", () => {
    expect(parseTimeoutSeconds("")).to.equal(undefined);
  });

  it("It should return undefined timeout when the given parameter is undefined", () => {
    expect(parseTimeoutSeconds(undefined)).to.equal(undefined);
  });

  it("It should return number timeout when the given parameter is number", () => {
    expect(parseTimeoutSeconds(1)).to.equal(1);
  });
});
