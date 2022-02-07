import "mocha";
import { expect } from "chai";
import { ChainDataResult } from "../../../src/modules/chains/types";
import { parseEthereum2State } from "../../../src/modules/chains/drivers/ethereum2";

describe("Watchers > chains > ethereum2Prysm", () => {
  describe("parseEthereum2PrysmState", () => {
    it("Should parse a syncing state", () => {
      const currentTime = 1607525912672;
      const chainData = parseEthereum2State(
        { genesisTime: "2020-11-18T12:00:07Z" },
        { config: { SecondsPerSlot: "12" } },
        { headSlot: "76050" },
        currentTime
      );

      const expecteChainData: ChainDataResult = {
        syncing: true,
        error: false,
        message: "Slots synced: 76050 / 152092",
        progress: 0.5000262998711307
      };

      expect(chainData).to.deep.equal(expecteChainData);
    });

    it("Should parse a synced state", () => {
      const currentTime = 1607525912672;
      const chainData = parseEthereum2State(
        { genesisTime: "2020-11-18T12:00:07Z" },
        { config: { SecondsPerSlot: "12" } },
        { headSlot: "152105" },
        currentTime
      );

      const expecteChainData: ChainDataResult = {
        syncing: false,
        error: false,
        message: "Synced #152105"
      };

      expect(chainData).to.deep.equal(expecteChainData);
    });
  });
});
