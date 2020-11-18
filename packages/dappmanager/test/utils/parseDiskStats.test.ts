import "mocha";
import { expect } from "chai";
import { parseDiskStats } from "../../src/utils/parseDiskStats";
import osu from "node-os-utils";

describe("Util: parseDiskStats", async function() {
  it("Should parse osu.mem.info output", () => {
    const dfOutput: osu.DriveInfo = {
      totalGb: 937.4,
      usedGb: 33.5,
      freeGb: 856.2,
      usedPercentage: 3.6,
      freePercentage: 91.3
    };

    const diskStats = parseDiskStats(dfOutput);
    expect(diskStats).to.deep.equal({
      total: 1006525585818,
      used: 35970351104,
      free: 919337749709,
      usedPercentage: 3.6,
      freePercentage: 91.3
    });
  });
});
