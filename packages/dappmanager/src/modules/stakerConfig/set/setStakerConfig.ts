import { packagesGet } from "../../../calls/index.js";
import { StakerConfigSet } from "@dappnode/common";
import { getStakerCompatibleVersionsByNetwork } from "./getStakerCompatibleVersionsByNetwork.js";
import * as db from "../../../db/index.js";
import { Network } from "@dappnode/types";
import { getStakerConfigByNetwork } from "../getStakerConfigByNetwork.js";
import { setConsensusClient } from "./setConsensusClient.js";
import { setExecutionClient } from "./setExecutionClient.js";
import { setSignerConfig } from "./setSignerConfig.js";
import { setMevBoost } from "./setMevBoost.js";
import { ensureSetRequirements } from "./ensureSetRequirements.js";

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
    feeRecipient,
    isMevBoostSelected
  } = getStakerConfigByNetwork(network);

  const pkgs = await packagesGet();
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

  // EXECUTION CLIENT
  await setExecutionClient<T>({
    network,
    currentExecutionClient,
    targetExecutionClient: executionClient,
    currentExecClientPkg
  });

  // CONSENSUS CLIENT (+ Fee recipient address + Graffiti + Checkpointsync)
  await setConsensusClient<T>({
    network: network,
    feeRecipient: feeRecipient,
    currentConsensusClient,
    targetConsensusClient: consensusClient,
    currentConsClientPkg
  });

  // WEB3SIGNER
  if (enableWeb3signer !== undefined)
    await setSignerConfig(
      enableWeb3signer,
      compatibleSigner.dnpName,
      currentWeb3signerPkg
    );

  // MEV BOOST
  await setMevBoost({
    network,
    mevBoost: compatibleMevBoost?.dnpName,
    targetMevBoost: mevBoost,
    currentMevBoostPkg
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
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}
