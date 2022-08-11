import * as db from "../db";
import { logs } from "../logs";
import { ComposeFileEditor } from "../modules/compose/editor";
import { Network, PkgStatus, StakerConfigGet, StakerConfigSet } from "../types";
import { prettyDnpName } from "../utils/format";
import { packageInstall } from "./packageInstall";
import { packageRemove } from "./packageRemove";
import { packagesGet } from "./packagesGet";

/**
 * Sets a new staker configuration based on user selection:
 * - New execution client
 * - New consensus client
 * - Install web3signer and/or mevboost
 * - graffiti and fee recipient address
 * @param stakerConfig
 */
export async function stakerConfigSet(
  stakerConfig: StakerConfigSet
): Promise<void> {
  const {
    execClientsAvail,
    currentExecClient,
    consClientsAvail,
    currentConsClient,
    web3signerAvail,
    mevBoostAvail
  } = getNetworkStakerPkgs(stakerConfig.network);

  // TODO: implement a proper try-catch error handler

  // Ensure Execution clients DNP's names are valid
  if (
    stakerConfig.executionClient &&
    !execClientsAvail.includes(prettyDnpName(stakerConfig.executionClient))
  )
    throw Error(
      `Invalid execution client ${stakerConfig.executionClient} for network ${stakerConfig.network}`
    );
  // Ensure Execution clients DNP's names are valid
  if (
    stakerConfig.consensusClient &&
    !consClientsAvail.includes(prettyDnpName(stakerConfig.consensusClient))
  )
    throw Error(
      `Invalid consensus client ${stakerConfig.consensusClient} for network ${stakerConfig.network}`
    );

  const pkgs = await packagesGet();

  // EXECUTION CLIENT
  if (stakerConfig.executionClient) {
    if (currentExecClient === stakerConfig.executionClient) {
      logs.info(
        "Execution client is already set to " + stakerConfig.executionClient
      );
      // Make sure the EC is installed
      if (!pkgs.find(p => p.dnpName === stakerConfig.executionClient)) {
        logs.info("Installing " + stakerConfig.executionClient);
        await packageInstall({ name: stakerConfig.executionClient });
      }
    } else {
      // Remove the previous
      logs.info("Removing " + currentExecClient);
      await packageRemove({ dnpName: currentExecClient });
      // Install the new EC
      logs.info("Installing " + stakerConfig.executionClient);
      await packageInstall({ name: stakerConfig.executionClient });
    }
  }

  // CONSENSUS CLIENT
  if (stakerConfig.consensusClient) {
    if (currentConsClient === stakerConfig.consensusClient) {
      logs.info(
        "Consensus client is already set to " + stakerConfig.consensusClient
      );
      // Make sure the CC is installed
      if (!pkgs.find(p => p.dnpName === stakerConfig.consensusClient)) {
        logs.info("Installing " + stakerConfig.consensusClient);
        await packageInstall({ name: stakerConfig.consensusClient });
      }
    } else {
      // Remove the previous
      logs.info("Removing " + currentConsClient);
      await packageRemove({ dnpName: currentConsClient });
      // Install the new CC
      logs.info("Installing " + stakerConfig.consensusClient);
      // TODO: the graffiti and the fee recipient must be set (if nothing set default values)
      await packageInstall({ name: stakerConfig.consensusClient });
    }
  }

  // WEB3SIGNER
  if (pkgs.find(p => p.dnpName === web3signerAvail)) {
    logs.info("Web3Signer is already installed");
  } else if (stakerConfig.installWeb3signer) {
    logs.info("Installing Web3Signer");
    await packageInstall({ name: web3signerAvail });
  }

  // MEV BOOST
  if (pkgs.find(p => p.dnpName === mevBoostAvail)) {
    logs.info("MevBoost is already installed");
  } else if (stakerConfig.installMevBoost) {
    logs.info("Installing MevBoost");
    await packageInstall({ name: mevBoostAvail });
  }
}

/**
 * Fetches the current staker configuration:
 * - execution clients: isInstalled and isSelected
 * - consensus clients: isInstalled and isSelected
 * - web3signer: isInstalled
 * - mevBoost: isInstalled
 * - graffiti
 * - fee recipient address
 * @param network
 */
export async function stakerConfigGet(
  network: Network
): Promise<StakerConfigGet> {
  const {
    execClientsAvail,
    currentExecClient,
    consClientsAvail,
    currentConsClient,
    web3signerAvail,
    mevBoostAvail
  } = getNetworkStakerPkgs(network);

  // TODO: implement a proper try-catch error handler

  const pkgs = await packagesGet();

  // Execution clients
  const executionClients: PkgStatus[] = [];
  for (const exCl of execClientsAvail) {
    executionClients.push({
      dnpName: exCl,
      isInstalled: pkgs.some(pkg => pkg.dnpName === exCl),
      isSelected: currentExecClient === exCl
    });
  }

  // Consensus clients
  const consensusClients: PkgStatus[] = [];
  for (const conCl of consClientsAvail) {
    consensusClients.push({
      dnpName: conCl,
      isInstalled: pkgs.some(pkg => pkg.dnpName === conCl),
      isSelected: currentConsClient === conCl
    });
  }

  // Web3signer
  const web3signer = {
    dnpName: web3signerAvail,
    isInstalled: pkgs.some(pkg => pkg.dnpName === web3signerAvail),
    isSelected: false
  };

  // Mevboost
  const mevBoost = {
    dnpName: mevBoostAvail,
    isInstalled: pkgs.some(pkg => pkg.dnpName === mevBoostAvail),
    isSelected: false
  };

  // Get graffiti and feerecipientAddress from the consClientInstalled (if any)
  const consensusPkgSelected = pkgs.find(
    pkg => pkg.dnpName === currentConsClient
  );
  let graffiti = "";
  let feeRecipient = "";
  if (consensusPkgSelected) {
    const environment = new ComposeFileEditor(
      consensusPkgSelected.dnpName,
      consensusPkgSelected.isCore
    ).getUserSettings().environment;
    if (environment) {
      const validatorService = consensusPkgSelected.dnpName.includes("nimbus")
        ? "validator"
        : "beacon-validator";
      graffiti = environment[validatorService].graffiti || "";
      feeRecipient = environment[validatorService].feeRecipient || "";
    }
  }

  return {
    executionClients,
    consensusClients,
    web3signer,
    mevBoost,
    graffiti,
    feeRecipient
  };
}

// Utils

/**
 * Get the current staker config (execution and consensus clients selected) as well as
 * the pkgs available for each network
 */
function getNetworkStakerPkgs(network: Network): {
  execClientsAvail: string[];
  currentExecClient: string;
  consClientsAvail: string[];
  currentConsClient: string;
  web3signerAvail: string;
  mevBoostAvail: string;
} {
  switch (network) {
    case "mainnet":
      return {
        execClientsAvail: [
          "geth.dnp.dappnode.eth",
          "nethermind.dnp.dappnode.eth",
          "besu.dnp.dappnode.eth",
          "erigon.dnp.dappnode.eth"
        ],
        currentExecClient: db.executionClientMainnet.get(),
        consClientsAvail: [
          "prysm.dnp.dappnode.eth",
          "lighthouse.dnp.dappnode.eth",
          "teku.dnp.dappnode.eth",
          "nimbus.dnp.dappnode.eth"
        ],
        currentConsClient: db.consensusClientMainnet.get(),
        web3signerAvail: "web3signer.dnp.dappnode.eth",
        mevBoostAvail: "mevboost.dnp.dappnode.eth"
      };

    case "gnosis":
      return {
        execClientsAvail: ["nethermind-xdai.dnp.dappnode.eth"],
        currentExecClient: db.executionClientGnosis.get(),
        consClientsAvail: [
          "gnosis-beacon-chain-prysm.dnp.dappnode.eth",
          "lighthouse-gnosis.dnp.dappnode.eth",
          "teku-gnosis.dnp.dappnode.eth"
        ],
        currentConsClient: db.consensusClientGnosis.get(),
        web3signerAvail: "web3signer-gnosis.dnp.dappnode.eth",
        mevBoostAvail: "mevboost-gnosis.dnp.dappnode.eth"
      };
    case "prater":
      return {
        execClientsAvail: ["goerli-geth.dnp.dappnode.eth"],
        currentExecClient: db.executionClientPrater.get(),
        consClientsAvail: [
          "prysm-prater.dnp.dappnode.eth",
          "lighthouse-prater.dnp.dappnode.eth",
          "teku-prater.dnp.dappnode.eth",
          "nimbus-prater.dnp.dappnode.eth"
        ],
        currentConsClient: db.consensusClientPrater.get(),
        web3signerAvail: "web3signer-prater.dnp.dappnode.eth",
        mevBoostAvail: "mevboost-prater.dnp.dappnode.eth"
      };
  }
}
