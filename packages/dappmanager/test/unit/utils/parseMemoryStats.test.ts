import "mocha";
import { expect } from "chai";
import { parseMemoryStats } from "../../../src/utils/parseMemoryStats";
import osu from "node-os-utils";

describe("Util: parseMemoryStats", async function () {
  it("Should parse osu.drive.info output", () => {
    const freeOutput: osu.MemInfo = {
      totalMemMb: 15769.03,
      usedMemMb: 5313.41,
      freeMemMb: 10455.62,
      freeMemPercentage: 66.3,
      usedMemPercentage: 0
    };

    const expectedResult: ReturnType<typeof parseMemoryStats> = {
      total: 16535026401,
      used: 5571514204,
      free: 10963512197,
      usedPercentage: 33.7
    };

    const memoryStats = parseMemoryStats(freeOutput);
    expect(memoryStats).to.deep.equal(expectedResult);
  });
});
