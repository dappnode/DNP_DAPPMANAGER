import { StakerConfigSet } from "@dappnode/common";
import { getStakerCompatibleVersionsByNetwork } from "./getStakerCompatibleVersionsByNetwork.js";
import * as db from "../../../db/index.js";
import { Network } from "@dappnode/types";
import { getStakerConfigByNetwork } from "../index.js";
import { setConsensusClient } from "./setConsensusClient.js";
import { setExecutionClient } from "./setExecutionClient.js";
import { setSigner } from "./setSigner.js";
import { setMevBoost } from "./setMevBoost.js";
import { ensureSetRequirements } from "./ensureSetRequirements.js";
import { listPackages } from "../../docker/list/listPackages.js";
import { getIsRunning } from "../utils.js";

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
    feeRecipient
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

  await Promise.all([
    // EXECUTION CLIENT
    setExecutionClient<T>({
      network,
      currentExecutionClient,
      targetExecutionClient: executionClient,
      currentExecClientPkg,
      isTargetRunning: executionClient?.dnpName
        ? getIsRunning({ dnpName: executionClient.dnpName }, pkgs)
        : false
    }),
    // CONSENSUS CLIENT (+ Fee recipient address + Graffiti + Checkpointsync)
    setConsensusClient<T>({
      network: network,
      feeRecipient: feeRecipient,
      currentConsensusClient,
      targetConsensusClient: consensusClient,
      currentConsClientPkg,
      isTargetRunning: consensusClient?.dnpName
        ? getIsRunning({ dnpName: consensusClient.dnpName }, pkgs)
        : false
    }),
    // WEB3SIGNER
    enableWeb3signer !== undefined &&
      setSigner({
        enableWeb3signer,
        web3signerDnpName: compatibleSigner.dnpName,
        web3signerPkg: currentWeb3signerPkg,
        isRunning: getIsRunning({ dnpName: compatibleSigner.dnpName }, pkgs)
      }),
    // MEVBOOST
    setMevBoost({
      network,
      mevBoost: compatibleMevBoost?.dnpName,
      targetMevBoost: mevBoost,
      currentMevBoostPkg,
      isRunning: getIsRunning({ dnpName: compatibleMevBoost?.dnpName }, pkgs)
    })
  ]);
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
