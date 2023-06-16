import {
  ConsensusClient,
  ExecutionClient,
  StakerConfigByNetwork
} from "@dappnode/common";
import { Network } from "@dappnode/types";
import * as db from "../../db/index.js";

export function getStakerConfigByNetwork<T extends Network>(
  network: T
): StakerConfigByNetwork<T> {
  switch (network) {
    case "mainnet":
      return {
        executionClient: "geth.dnp.dappnode.eth" as ExecutionClient<T>,
        consensusClient: db.consensusClientMainnet.get() as ConsensusClient<T>,
        feeRecipient: db.feeRecipientMainnet.get(),
        isMevBoostSelected: db.mevBoostMainnet.get()
      };
    case "gnosis":
      return {
        executionClient: db.executionClientGnosis.get() as ExecutionClient<T>,
        consensusClient: db.consensusClientGnosis.get() as ConsensusClient<T>,
        feeRecipient: db.feeRecipientGnosis.get(),
        isMevBoostSelected: false // gnosis doesn't support mevBoost
      };
    case "prater":
      return {
        executionClient: db.executionClientMainnet.get() as ExecutionClient<T>,
        consensusClient: db.consensusClientMainnet.get() as ConsensusClient<T>,
        feeRecipient: db.feeRecipientMainnet.get(),
        isMevBoostSelected: db.mevBoostPrater.get()
      };
    default:
      throw new Error(`Network ${network} not supported`);
  }
}
