import { StakerConfigByNetwork, Network } from "@dappnode/types";
import * as db from "@dappnode/db";

export function getStakerConfigByNetwork(
  network: Network
): StakerConfigByNetwork {
  switch (network) {
    case "mainnet":
      return {
        executionClient: db.executionClientMainnet.get(),
        consensusClient: db.consensusClientMainnet.get(),
        isMevBoostSelected: db.mevBoostMainnet.get(),
      };
    case "gnosis":
      return {
        executionClient: db.executionClientGnosis.get(),
        consensusClient: db.consensusClientGnosis.get(),
        isMevBoostSelected: false, // gnosis doesn't support mevBoost
      };
    case "prater":
      return {
        executionClient: db.executionClientPrater.get(),
        consensusClient: db.consensusClientPrater.get(),
        isMevBoostSelected: db.mevBoostPrater.get(),
      };
    case "holesky":
      return {
        executionClient: db.executionClientHolesky.get(),
        consensusClient: db.consensusClientHolesky.get(),
        isMevBoostSelected: db.mevBoostHolesky.get(),
      };
    case "lukso":
      return {
        executionClient: db.executionClientLukso.get(),
        consensusClient: db.consensusClientLukso.get(),
        isMevBoostSelected: false, // lukso doesn't support mevBoost
      };
    default:
      throw new Error(`Network ${network} not supported`);
  }
}
