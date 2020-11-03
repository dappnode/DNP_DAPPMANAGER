import "mocha";
import { expect } from "chai";

import { parseTimeout } from "../../src/utils/timeout";

describe("Util: timeout", () => {
  it("It should parse string parameter to number", () => {
    const str = "20min"; // 12000 segs, 1200000ms
    expect(parseTimeout(str)).to.equal(1200000);
  });
  it("It should return undefined timeout when the given parameter is undefined", () => {
    expect(parseTimeout(undefined)).to.equal(undefined);
  });
});
