import * as db from "../db";
import { Network, NetworkConsensusType, NetworkExecutionType } from "../common";

export async function consensClientGet<T extends Network>(
  network: T
): Promise<NetworkConsensusType<T>> {
  switch (network) {
    case "mainnet":
      return db.consensusClientMainnet.get();
    case "gnosis":
      return db.consensusClientGnosis.get();
    case "prater":
      return db.consensusClientPrater.get();
    default:
      throw Error(`Unknown network: ${network}`);
  }
}

export async function executionClientGet<T extends Network>(
  network: T
): Promise<NetworkExecutionType<T>> {
  switch (network) {
    case "mainnet":
      return db.executionClientMainnet.get();
    case "gnosis":
      return db.executionClientGnosis.get();
    case "prater":
      return db.executionClientPrater.get();
    default:
      throw Error(`Unknown network ${network}`);
  }
}

export async function consensusClientSet<T extends Network>(
  network: T,
  consensusClient: NetworkConsensusType<T>
): Promise<void> {
  // TODO
}

export async function executionClientSet<T extends Network>(
  network: T,
  executionClient: NetworkExecutionType<T>
): Promise<void> {
  // TODO
}
