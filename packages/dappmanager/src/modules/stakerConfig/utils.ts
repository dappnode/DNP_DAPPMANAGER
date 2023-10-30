import {
  ConsensusClient,
  ExecutionClient,
  StakerConfigByNetwork
} from "@dappnode/common";
import * as db from "@dappnode/db";
import { Network } from "@dappnode/types";

export function getStakerConfigByNetwork<T extends Network>(
  network: T
): StakerConfigByNetwork<T> {
  switch (network) {
    case "mainnet":
      return {
        executionClient: db.executionClientMainnet.get() as ExecutionClient<T>,
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
        executionClient: db.executionClientPrater.get() as ExecutionClient<T>,
        consensusClient: db.consensusClientPrater.get() as ConsensusClient<T>,
        feeRecipient: db.feeRecipientPrater.get(),
        isMevBoostSelected: db.mevBoostPrater.get()
      };
    case "lukso":
      return {
        executionClient: db.executionClientLukso.get() as ExecutionClient<T>,
        consensusClient: db.consensusClientLukso.get() as ConsensusClient<T>,
        feeRecipient: db.feeRecipientLukso.get(),
        isMevBoostSelected: false // lukso doesn't support mevBoost
      };
    default:
      throw new Error(`Network ${network} not supported`);
  }
}
