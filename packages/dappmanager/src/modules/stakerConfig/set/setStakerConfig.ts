import { packagesGet } from "../../../calls/index.js";
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
  ExecutionClientGnosis,
  ExecutionClientMainnet,
  ExecutionClientPrater,
  Network
} from "@dappnode/types";
import { getStakerConfigByNetwork } from "../index.js";
import { ensureSetRequirements } from "./ensureSetRequirements.js";
import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

  // Set staker config using threads
  // Initialize Workers for each method
  const workerDataList: any[] = [
    {
      workerData: {
        network,
        currentExecutionClient,
        targetExecutionClient: executionClient,
        currentExecClientPkg
      },
      workerMethod: join(__dirname, "./setExecutionClientWorker")
    },
    {
      workerData: {
        network,
        feeRecipient,
        currentConsensusClient,
        targetConsensusClient: consensusClient,
        currentConsClientPkg
      },
      workerMethod: join(__dirname, "./setConsensusClientWorker")
    },

    {
      workerData: {
        network,
        mevBoost: compatibleMevBoost?.dnpName,
        targetMevBoost: mevBoost,
        currentMevBoostPkg
      },
      workerMethod: join(__dirname, "./setMevBoostWorker")
    }
  ];

  enableWeb3signer !== undefined &&
    workerDataList.push({
      workerData: {
        network,
        enableWeb3signer,
        compatibleSignerName: compatibleSigner.dnpName,
        currentWeb3signerPkg
      },
      workerMethod: join(__dirname, "./setSignerWorker")
    });

  // Use Promise.all to execute all workers simultaneously
  await Promise.all(
    workerDataList.map(
      ({ workerData, workerMethod }) =>
        new Promise((resolve, reject) => {
          const worker = new Worker(workerMethod, { workerData });
          worker.on("message", async message => {
            if (message === "execution") {
              await setExecutionOnDb(network, executionClient?.dnpName);
            } else if (message === "consensus") {
              await setConsensusOnDb(network, consensusClient?.dnpName);
            } else if (message === "mevBoost") {
              await setMevBoostOnDb(network, compatibleMevBoost?.dnpName);
            }

            resolve;
          });
          worker.on("error", reject);
          worker.on("exit", code => {
            if (code !== 0)
              reject(new Error(`Worker stopped with exit code ${code}`));
          });
        })
    )
  );
}

/**
 * Sets the staker configuration on db for a given network
 * IMPORTANT: check the values are different before setting them so the interceptGlobalOnSet is not called
 */
async function setExecutionOnDb<T extends Network>(
  network: T,
  executionClient?: ExecutionClient<T>
): Promise<void> {
  switch (network) {
    case "mainnet":
      if (db.executionClientMainnet.get() !== executionClient)
        await db.executionClientMainnet.set(
          executionClient as ExecutionClientMainnet
        );
      break;
    case "gnosis":
      if (db.executionClientGnosis.get() !== executionClient)
        await db.executionClientGnosis.set(
          executionClient as ExecutionClientGnosis
        );
      break;
    case "prater":
      if (db.executionClientPrater.get() !== executionClient)
        await db.executionClientPrater.set(
          executionClient as ExecutionClientPrater
        );
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

/**
 * Sets the staker configuration on db for a given network
 * IMPORTANT: check the values are different before setting them so the interceptGlobalOnSet is not called
 */
async function setConsensusOnDb<T extends Network>(
  network: T,
  consensusClient?: ConsensusClient<T>
): Promise<void> {
  switch (network) {
    case "mainnet":
      if (db.consensusClientMainnet.get() !== consensusClient)
        await db.consensusClientMainnet.set(
          consensusClient as ConsensusClientMainnet
        );
      break;
    case "gnosis":
      if (db.consensusClientGnosis.get() !== consensusClient)
        await db.consensusClientGnosis.set(
          consensusClient as ConsensusClientGnosis
        );
      break;
    case "prater":
      if (db.consensusClientPrater.get() !== consensusClient)
        await db.consensusClientPrater.set(
          consensusClient as ConsensusClientPrater
        );
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

/**
 * Sets the staker configuration on db for a given network
 * IMPORTANT: check the values are different before setting them so the interceptGlobalOnSet is not called
 */
async function setMevBoostOnDb<T extends Network>(
  network: T,
  mevBoost?: MevBoost<T>
): Promise<void> {
  switch (network) {
    case "mainnet":
      if (db.mevBoostMainnet.get() !== Boolean(mevBoost))
        await db.mevBoostMainnet.set(mevBoost ? true : false);
      break;
    case "gnosis":
      if (db.mevBoostGnosis.get() !== Boolean(mevBoost))
        await db.mevBoostGnosis.set(mevBoost ? true : false);
      break;
    case "prater":
      if (db.mevBoostPrater.get() !== Boolean(mevBoost))
        await db.mevBoostPrater.set(mevBoost ? true : false);
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
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
