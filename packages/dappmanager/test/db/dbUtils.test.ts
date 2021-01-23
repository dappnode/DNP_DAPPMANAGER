import { expect } from "chai";
import { joinWithDot } from "../../src/db/dbUtils";

describe("db / dbUtils", () => {
  describe("joinWithDot", () => {
    const testCases: { keys: string[]; res: string }[] = [
      { keys: ["a", "b", "c"], res: "a.b.c" },
      { keys: ["a.b.c", "id1.b.c", "id2.b.c"], res: "a-b-c.id1-b-c.id2-b-c" },
      { keys: ["simple-key"], res: "simple-key" }
    ];

    for (const { keys, res } of testCases) {
      it(JSON.stringify(keys), () => {
        expect(joinWithDot(...keys)).to.equal(res);
      });
    }
  });
});
