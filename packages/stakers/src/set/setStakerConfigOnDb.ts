import * as db from "@dappnode/db";
import {
  Network,
  ExecutionClientMainnet,
  ConsensusClientMainnet,
  ExecutionClientGnosis,
  ConsensusClientGnosis,
  ExecutionClientPrater,
  ConsensusClientPrater,
  ExecutionClientHolesky,
  ConsensusClientHolesky,
  ExecutionClientLukso,
  ConsensusClientLukso,
} from "@dappnode/types";

/**
 * Persist staker configuration on db.
 * it is important to set the staker configuration at the same time as long as it us being used the global envs for staker pkgs comms
 * TODO: Once rely on docker staker network instead of global envs, move this setter to the classes execution consensus signer and mevboost
 * @param network
 * @param executionClient
 * @param consensusClient
 * @param mevBoost
 */
export async function setStakerConfigOnDb({
  network,
  executionDnpName,
  consensusDnpName,
  mevBoostDnpName,
}: {
  network: Network;
  executionDnpName: string | null;
  consensusDnpName: string | null;
  mevBoostDnpName: string | null;
}): Promise<void> {
  switch (network) {
    case "mainnet":
      if (db.executionClientMainnet.get() !== executionDnpName)
        await db.executionClientMainnet.set(
          executionDnpName as ExecutionClientMainnet
        );
      if (db.consensusClientMainnet.get() !== consensusDnpName)
        await db.consensusClientMainnet.set(
          consensusDnpName as ConsensusClientMainnet
        );
      if (db.mevBoostMainnet.get() !== Boolean(mevBoostDnpName))
        await db.mevBoostMainnet.set(mevBoostDnpName ? true : false);
      break;
    case "gnosis":
      if (db.executionClientGnosis.get() !== executionDnpName)
        await db.executionClientGnosis.set(
          executionDnpName as ExecutionClientGnosis
        );
      if (db.consensusClientGnosis.get() !== consensusDnpName)
        await db.consensusClientGnosis.set(
          consensusDnpName as ConsensusClientGnosis
        );
      /*if (db.mevBoostGnosis.get() !== Boolean(mevBoostDnpName))
        await db.mevBoostMainnet.set(mevBoostDnpName ? true : false);*/
      break;

    case "prater":
      if (db.executionClientPrater.get() !== executionDnpName)
        await db.executionClientPrater.set(
          executionDnpName as ExecutionClientPrater
        );
      if (db.consensusClientPrater.get() !== consensusDnpName)
        await db.consensusClientPrater.set(
          consensusDnpName as ConsensusClientPrater
        );
      if (db.mevBoostPrater.get() !== Boolean(mevBoostDnpName))
        await db.mevBoostPrater.set(mevBoostDnpName ? true : false);
      break;

    case "holesky":
      if (db.executionClientHolesky.get() !== executionDnpName)
        await db.executionClientHolesky.set(
          executionDnpName as ExecutionClientHolesky
        );
      if (db.consensusClientHolesky.get() !== consensusDnpName)
        await db.consensusClientHolesky.set(
          consensusDnpName as ConsensusClientHolesky
        );
      if (db.mevBoostHolesky.get() !== Boolean(mevBoostDnpName))
        await db.mevBoostHolesky.set(mevBoostDnpName ? true : false);
      break;

    case "lukso":
      if (db.executionClientLukso.get() !== executionDnpName)
        await db.executionClientLukso.set(
          executionDnpName as ExecutionClientLukso
        );
      if (db.consensusClientLukso.get() !== consensusDnpName)
        await db.consensusClientLukso.set(
          consensusDnpName as ConsensusClientLukso
        );
      /*if (db.mevBoostLukso.get() !== Boolean(mevBoostDnpName))
        await db.mevBoostLukso.set(mevBoostDnpName ? true : false);*/
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}
