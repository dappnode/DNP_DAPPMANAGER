import "mocha";
import { expect } from "chai";

import randomToken from "../../src/utils/randomToken";

describe("Util: randomToken", () => {
  it("should generate a random token", async () => {
    const byteLength = 32;
    const s = await randomToken(32);

    expect(s).to.be.a("string");
    expect(s.length).to.equal(2 * byteLength);
  });
});
