import "mocha";
import { expect } from "chai";
import { parseDiskStats } from "../../src/utils/parseDiskStats";

describe('Util: parseDiskStats', async function () {
    it("Should parse df / output", () => {
        const dfOutput = `Filesystem                1K-blocks      Used Available Use% Mounted on
      /dev/mapper/mint--vg-root 235782040 184988848  38746448  83% /`;
        
        const diskStats = parseDiskStats(dfOutput);
        expect(diskStats).to.deep.equal({
            filesystem: "/dev/mapper/mint--vg-root",
            bBlocks: "235782040",
            used: "184988848",
            available: "38746448",
            use: "83%",
            mountedOn: "/",
            useFraction: 0.342153612,
          });
        }
    )
}