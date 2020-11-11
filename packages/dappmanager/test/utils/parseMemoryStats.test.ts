import "mocha";
import { expect } from "chai";
import { parseMemoryStats } from "../../src/utils/parseMemoryStats";

describe("Util: parseMemoryStats", async function() {
  it("Should parse <free / --bytes> output", () => {
    const freeOutput = `total        used        free      shared  buff/cache   available
    Mem:    16535027712  5445357568  4503203840  1618006016  6586466304  9713278976
    Swap:    2147479552           0  2147479552`;

    const memoryStats = parseMemoryStats(freeOutput);
    expect(memoryStats).to.not.be.empty;
    expect(typeof memoryStats.useFraction).to.deep.equal("number"); // Only one number in memoryStats. If useFraction is number, the order is correct
  });
});
