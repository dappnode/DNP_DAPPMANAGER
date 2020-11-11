import "mocha";
import { expect } from "chai";
import { parseDiskStats } from "../../src/utils/parseDiskStats";

describe("Util: parseDiskStats", async function() {
  it("Should parse <df / --block-size=1> output", () => {
    const dfOutput = `Filesystem         1B-blocks        Used    Available Use% Mounted on
    /dev/nvme0n1p2 1006530654208 27390177280 927940136960   3% /`;

    const diskStats = parseDiskStats(dfOutput);
    expect(diskStats).to.deep.equal({
      filesystem: "/dev/nvme0n1p2",
      bBlocks: "1006530654208",
      used: "27390177280",
      available: "927940136960",
      usePercentage: "3%",
      mountedOn: "/",
      useFraction: 0.028670897250643493
    });
  });
});
