import "mocha";
import { expect } from "chai";
import { parseDfPB1Output } from "../../src/calls/statsDiskGet";

describe("calls / statsDiskGet", async function() {
  it("Should parse `df -PB1 /` output", () => {
    const output = `Filesystem           1-blocks       Used Available Capacity Mounted on
overlay              420695474176 97052733440 302201196544  24% /
`;

    const expectedResult: ReturnType<typeof parseDfPB1Output> = {
      total: 420695474176,
      used: 97052733440,
      free: 302201196544,
      usedPercentage: 28
    };

    const diskStats = parseDfPB1Output(output);
    expect(diskStats).to.deep.equal(expectedResult);
  });
});
