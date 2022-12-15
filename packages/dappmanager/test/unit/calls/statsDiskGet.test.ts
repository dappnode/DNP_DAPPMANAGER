import "mocha";
import { expect } from "chai";
import { parseDfPB1Output } from "../../../src/calls/statsDiskGet";

describe("calls / statsDiskGet", () => {
  describe("parseDfPB1Output", () => {
    it("Regular case", () => {
      const output = `Filesystem           1-blocks       Used Available Capacity Mounted on
  overlay              420695474176 97052733440 302201196544  24% /
  `;

      const expectedResult: ReturnType<typeof parseDfPB1Output> = {
        total: 420695474176,
        used: 118494277632,
        free: 302201196544,
        usedPercentage: 28
      };

      const diskStats = parseDfPB1Output(output);
      expect(diskStats).to.deep.equal(expectedResult);
    });

    it("Completely full", () => {
      const output = `Filesystem     1K-blocks      Used Available Use% Mounted on
/dev/sda2      410835424000 388579748000 1316668000 100% /
`;

      const expectedResult: ReturnType<typeof parseDfPB1Output> = {
        total: 410835424000,
        used: 409518756000,
        free: 1316668000,
        usedPercentage: 100
      };

      const diskStats = parseDfPB1Output(output);
      expect(diskStats).to.deep.equal(expectedResult);
    });
  });
});
