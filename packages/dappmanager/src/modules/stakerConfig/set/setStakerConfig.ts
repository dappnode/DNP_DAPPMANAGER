import {
  ConsensusClient,
  ExecutionClient,
  MevBoost,
  StakerConfigSet
} from "@dappnode/common";
import { getStakerCompatibleVersionsByNetwork } from "./getStakerCompatibleVersionsByNetwork.js";
import * as db from "../../../db/index.js";
import {
  ConsensusClientGnosis,
  ConsensusClientMainnet,
  ConsensusClientPrater,
  ConsensusClientLukso,
  ExecutionClientGnosis,
  ExecutionClientMainnet,
  ExecutionClientPrater,
  ExecutionClientLukso,
  Network
} from "@dappnode/types";
import { getStakerConfigByNetwork } from "../index.js";
import { setConsensusClient } from "./setConsensusClient.js";
import { setExecutionClient } from "./setExecutionClient.js";
import { setSigner } from "./setSigner.js";
import { setMevBoost } from "./setMevBoost.js";
import { ensureSetRequirements } from "./ensureSetRequirements.js";
import { listPackages } from "../../docker/list/listPackages.js";

/**
 *  Sets a new staker configuration based on user selection:
 * - New execution client
 * - New consensus client
 * - Install web3signer and/or mevboost
 * - Checkpointsync, graffiti and fee recipient address
 * @param stakerConfig
 * TODO: add option to remove previous or not
 */
export async function setStakerConfig<T extends Network>({
  network,
  feeRecipient,
  executionClient,
  consensusClient,
  mevBoost,
  enableWeb3signer
}: StakerConfigSet<T>): Promise<void> {
  const {
    compatibleExecution,
    compatibleConsensus,
    compatibleSigner,
    compatibleMevBoost
  } = getStakerCompatibleVersionsByNetwork(network);

  const {
    executionClient: currentExecutionClient,
    consensusClient: currentConsensusClient,
  } = getStakerConfigByNetwork(network);

  const pkgs = await listPackages();
  const currentExecClientPkg = pkgs.find(
    pkg => pkg.dnpName === currentExecutionClient
  );
  const currentConsClientPkg = pkgs.find(
    pkg => pkg.dnpName === currentConsensusClient
  );
  const currentWeb3signerPkg = pkgs.find(
    pkg => pkg.dnpName === compatibleSigner.dnpName
  );
  const currentMevBoostPkg = pkgs.find(
    pkg => pkg.dnpName === compatibleMevBoost?.dnpName
  );

  // Ensure requirements
  ensureSetRequirements({
    network,
    executionClient,
    consensusClient,
    compatibleExecution,
    compatibleConsensus,
    compatibleSigner,
    currentExecClientPkg,
    currentConsClientPkg,
    currentWeb3signerPkg
  });
  // Set fee recipient on db
  await setFeeRecipientOnDb(network, feeRecipient || undefined);

  // Set staker config pkgs and its configurations
  await Promise.all([
    // EXECUTION CLIENT
    setExecutionClient<T>({
      currentExecutionClient,
      targetExecutionClient: executionClient,
      currentExecClientPkg
    }),
    // CONSENSUS CLIENT (+ Fee recipient address + Graffiti + Checkpointsync)
    setConsensusClient<T>({
      network: network,
      feeRecipient: feeRecipient,
      currentConsensusClient,
      targetConsensusClient: consensusClient,
      currentConsClientPkg
    }),
    // MEVBOOST
    setMevBoost({
      mevBoost: compatibleMevBoost?.dnpName,
      targetMevBoost: mevBoost,
      currentMevBoostPkg
    })
  ]);

  // Set staker config on db
  await setStakerConfigOnDb(
    network,
    executionClient?.dnpName,
    consensusClient?.dnpName,
    mevBoost?.dnpName
  );

  // WEB3SIGNER
  // The web3signer deppends on the global envs EXECUTION_CLIENT and CONSENSUS_CLIENT
  // so it is convenient to set it at the end once the db is updated
  await setSigner({
    enableWeb3signer,
    web3signerDnpName: compatibleSigner.dnpName,
    web3signerPkg: currentWeb3signerPkg
  });
}

/**
 * Sets the staker configuration on db for a given network
 * IMPORTANT: check the values are different before setting them so the interceptGlobalOnSet is not called
 */
async function setFeeRecipientOnDb<T extends Network>(
  network: T,
  feeRecipient?: string
): Promise<void> {
  switch (network) {
    case "mainnet":
      if (
        feeRecipient !== undefined &&
        db.feeRecipientMainnet.get() !== feeRecipient
      )
        await db.feeRecipientMainnet.set(feeRecipient);
      break;
    case "gnosis":
      if (
        feeRecipient !== undefined &&
        db.feeRecipientGnosis.get() !== feeRecipient
      )
        await db.feeRecipientGnosis.set(feeRecipient);
      break;
    case "prater":
      if (
        feeRecipient !== undefined &&
        db.feeRecipientPrater.get() !== feeRecipient
      )
        await db.feeRecipientPrater.set(feeRecipient);
      break;
    case "lukso":
      if (
        feeRecipient !== undefined &&
        db.feeRecipientLukso.get() !== feeRecipient
      )
        await db.feeRecipientLukso.set(feeRecipient);
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

async function setStakerConfigOnDb<T extends Network>(
  network: T,
  executionClient?: ExecutionClient<T>,
  consensusClient?: ConsensusClient<T>,
  mevBoost?: MevBoost<T>
): Promise<void> {
  switch (network) {
    case "mainnet":
      if (db.executionClientMainnet.get() !== executionClient)
        await db.executionClientMainnet.set(
          executionClient as ExecutionClientMainnet
        );
      if (db.consensusClientMainnet.get() !== consensusClient)
        await db.consensusClientMainnet.set(
          consensusClient as ConsensusClientMainnet
        );
      if (db.mevBoostMainnet.get() !== Boolean(mevBoost))
        await db.mevBoostMainnet.set(mevBoost ? true : false);
      break;
    case "gnosis":
      if (db.executionClientGnosis.get() !== executionClient)
        await db.executionClientGnosis.set(
          executionClient as ExecutionClientGnosis
        );
      if (db.consensusClientGnosis.get() !== consensusClient)
        await db.consensusClientGnosis.set(
          consensusClient as ConsensusClientGnosis
        );
      /*if (db.mevBoostGnosis.get() !== Boolean(mevBoost))
        await db.mevBoostMainnet.set(mevBoost ? true : false);*/
      break;

    case "prater":
      if (db.executionClientPrater.get() !== executionClient)
        await db.executionClientPrater.set(
          executionClient as ExecutionClientPrater
        );
      if (db.consensusClientPrater.get() !== consensusClient)
        await db.consensusClientPrater.set(
          consensusClient as ConsensusClientPrater
        );
      if (db.mevBoostPrater.get() !== Boolean(mevBoost))
        await db.mevBoostPrater.set(mevBoost ? true : false);
      break;

    case "lukso":
      if (db.executionClientLukso.get() !== executionClient)
        await db.executionClientLukso.set(
          executionClient as ExecutionClientLukso
        );
      if (db.consensusClientLukso.get() !== consensusClient)
        await db.consensusClientLukso.set(
          consensusClient as ConsensusClientLukso
        );
      /*if (db.mevBoostLukso.get() !== Boolean(mevBoost))
        await db.mevBoostLukso.set(mevBoost ? true : false);*/
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}
