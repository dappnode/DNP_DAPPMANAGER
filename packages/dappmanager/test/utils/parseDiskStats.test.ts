import "mocha";
import { expect } from "chai";
import { parseDiskStats } from "../../src/utils/parseDiskStats";

describe("Util: parseDiskStats", async function() {
  it("Should parse <df / --block-size=1> output", () => {
    const dfOutput = `Filesystem         1B-blocks        Used    Available Use% Mounted on
    /dev/nvme0n1p2 1006530654208 27418755072 927911559168   3% /`;

    const diskStats = parseDiskStats(dfOutput);
    expect(diskStats).to.not.be.empty;
    expect(diskStats.filesystem).to.include("/"); // If filesystem argument has '/', the order should be correct.
  });
});
