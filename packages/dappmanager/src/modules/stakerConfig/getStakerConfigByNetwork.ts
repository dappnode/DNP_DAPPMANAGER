import { StakerConfigByNetwork } from "@dappnode/common";
import { Network } from "@dappnode/types";
import * as db from "../../db/index.js";

export function getStakerConfigByNetwork(
  network: Network
): StakerConfigByNetwork<Network> {
  switch (network) {
    case "mainnet":
      return {
        executionClient: "geth.dnp.dappnode.eth",
        consensusClient: db.consensusClientMainnet.get(),
        feeRecipient: db.feeRecipientMainnet.get(),
        isMevBoostSelected: db.mevBoostMainnet.get()
      };
    case "gnosis":
      return {
        executionClient: db.executionClientGnosis.get(),
        consensusClient: db.consensusClientGnosis.get(),
        feeRecipient: db.feeRecipientGnosis.get(),
        isMevBoostSelected: null
      };
    case "prater":
      return {
        executionClient: db.executionClientMainnet.get(),
        consensusClient: db.consensusClientMainnet.get(),
        feeRecipient: db.feeRecipientMainnet.get(),
        isMevBoostSelected: db.mevBoostPrater.get()
      };
    default:
      throw new Error(`Network ${network} not supported`);
  }
}
