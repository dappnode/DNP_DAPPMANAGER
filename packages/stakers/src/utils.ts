import {
  ConsensusClient,
  ExecutionClient,
  StakerConfigByNetwork,
  Network,
} from "@dappnode/types";
import * as db from "@dappnode/db";

export function getStakerConfigByNetwork<T extends Network>(
  network: T
): StakerConfigByNetwork<T> {
  switch (network) {
    case "mainnet":
      return {
        executionClient: db.executionClientMainnet.get() as ExecutionClient<T>,
        consensusClient: db.consensusClientMainnet.get() as ConsensusClient<T>,
        isMevBoostSelected: db.mevBoostMainnet.get(),
      };
    case "gnosis":
      return {
        executionClient: db.executionClientGnosis.get() as ExecutionClient<T>,
        consensusClient: db.consensusClientGnosis.get() as ConsensusClient<T>,
        isMevBoostSelected: false, // gnosis doesn't support mevBoost
      };
    case "prater":
      return {
        executionClient: db.executionClientPrater.get() as ExecutionClient<T>,
        consensusClient: db.consensusClientPrater.get() as ConsensusClient<T>,
        isMevBoostSelected: db.mevBoostPrater.get(),
      };
    case "holesky":
      return {
        executionClient: db.executionClientHolesky.get() as ExecutionClient<T>,
        consensusClient: db.consensusClientHolesky.get() as ConsensusClient<T>,
        isMevBoostSelected: false, // holesky doesn't support mevBoost
      };
    case "lukso":
      return {
        executionClient: db.executionClientLukso.get() as ExecutionClient<T>,
        consensusClient: db.consensusClientLukso.get() as ConsensusClient<T>,
        isMevBoostSelected: false, // lukso doesn't support mevBoost
      };
    default:
      throw new Error(`Network ${network} not supported`);
  }
}
