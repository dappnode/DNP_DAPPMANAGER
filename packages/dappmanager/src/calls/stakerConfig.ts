import * as db from "../db";
import { logs } from "../logs";
import { ComposeFileEditor } from "../modules/compose/editor";
import {
  Network,
  PkgStatus,
  StakerConfigGet,
  StakerConfigSet,
  UserSettingsAllDnps
} from "../types";
import { prettyDnpName } from "../utils/format";
import { packageInstall } from "./packageInstall";
import { packagesGet } from "./packagesGet";
import { packageStartStop } from "./packageStartStop";

/**
 * Sets a new staker configuration based on user selection:
 * - New execution client
 * - New consensus client
 * - Install web3signer and/or mevboost
 * - graffiti and fee recipient address
 * @param stakerConfig
 */
export async function stakerConfigSet({
  stakerConfig
}: {
  stakerConfig: StakerConfigSet;
}): Promise<void> {
  const {
    execClientsAvail,
    currentExecClient,
    consClientsAvail,
    currentConsClient,
    web3signerAvail,
    mevBoostAvail
  } = getNetworkStakerPkgs(stakerConfig.network);

  try {
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
        /* logs.info("Removing " + currentExecClient);
      await packageRemove({ dnpName: currentExecClient }); */
        // Install the new EC
        logs.info("Installing " + stakerConfig.executionClient);
        await packageInstall({ name: stakerConfig.executionClient });
      }
    }

    // CONSENSUS CLIENT
    if (stakerConfig.consensusClient) {
      const userSettings: UserSettingsAllDnps = {
        [stakerConfig.consensusClient]: {
          environment: {
            [getValidatorServiceName(stakerConfig.consensusClient)]: {
              ["GRAFFITI"]: stakerConfig.graffiti || "Validating_from_DAppNode",
              ["FEE_RECIPIENT_ADDRESS"]:
                stakerConfig.feeRecipient ||
                "0x0000000000000000000000000000000000000000"
            }
          }
        }
      };

      if (currentConsClient === stakerConfig.consensusClient) {
        logs.info(
          "Consensus client is already set to " + stakerConfig.consensusClient
        );
        // Make sure the CC is installed
        if (!pkgs.find(p => p.dnpName === stakerConfig.consensusClient)) {
          logs.info("Installing " + stakerConfig.consensusClient);
          await packageInstall({
            name: stakerConfig.consensusClient,
            userSettings
          });
        }
      } else {
        // Remove the previous
        /*       logs.info("Removing " + currentConsClient);
      await packageRemove({ dnpName: currentConsClient }); */
        // Install the new CC
        logs.info("Installing " + stakerConfig.consensusClient);
        await packageInstall({
          name: stakerConfig.consensusClient,
          userSettings
        });
      }
    }

    // WEB3SIGNER
    const web3signerPkg = pkgs.find(p => p.dnpName === web3signerAvail);
    if (web3signerPkg && stakerConfig.enableWeb3signer) {
      // Do nothing, web3signer enabled and installed
      logs.info("Web3Signer is already installed");
    } else if (!web3signerPkg && stakerConfig.enableWeb3signer) {
      // Install web3signer
      logs.info("Installing Web3Signer");
      // TODO: check if its necessary userSettings needed for web3signer
      await packageInstall({ name: web3signerAvail });
    } else if (web3signerPkg && !stakerConfig.enableWeb3signer) {
      // Stop web3signer
      for (const container of web3signerPkg.containers) {
        if (container.running) {
          logs.info("Stopping Web3Signer");
          await packageStartStop({
            dnpName: web3signerPkg.dnpName,
            serviceNames: [container.serviceName]
          });
        }
      }
    }

    // MEV BOOST
    const mevBoostPkg = pkgs.find(p => p.dnpName === mevBoostAvail);
    if (stakerConfig.enableMevBoost) {
      if (mevBoostPkg) {
        logs.info("MevBoost is already installed");
      } else if (stakerConfig.enableMevBoost) {
        // Install mevboost if selected and not installed
        logs.info("Installing MevBoost");
        await packageInstall({ name: mevBoostAvail });
      }
    }

    // Persist the staker config on db
    setStakerConfigOnDb(stakerConfig.network, stakerConfig);
  } catch (e) {
    throw Error(`Error setting staker config: ${e}`);
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
  try {
    const {
      execClientsAvail,
      currentExecClient,
      consClientsAvail,
      currentConsClient,
      web3signerAvail,
      mevBoostAvail,
      isMevBoostSelected
    } = getNetworkStakerPkgs(network);

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
    const isWeb3signer = pkgs.some(pkg => pkg.dnpName === web3signerAvail);
    const web3signer = {
      dnpName: web3signerAvail,
      isInstalled: isWeb3signer,
      isSelected: isWeb3signer
    };

    // Mevboost
    const mevBoost = {
      dnpName: mevBoostAvail,
      isInstalled: pkgs.some(pkg => pkg.dnpName === mevBoostAvail),
      isSelected: isMevBoostSelected
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
        const validatorService = getValidatorServiceName(
          consensusPkgSelected.dnpName
        );
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
  } catch (e) {
    throw Error(`Error getting staker config: ${e}`);
  }
}

// Utils

/**
 * Sets the staker configuration on db for a given network
 */
function setStakerConfigOnDb(
  network: Network,
  stakerConfig: StakerConfigSet
): Promise<void> {
  switch (network) {
    case "mainnet":
      db.executionClientMainnet.set(stakerConfig.executionClient);
      db.consensusClientMainnet.set(stakerConfig.consensusClient);
      db.mevBoostMainnet.set(stakerConfig.enableMevBoost);
    case "gnosis":
      db.executionClientGnosis.set(stakerConfig.executionClient);
      db.consensusClientGnosis.set(stakerConfig.consensusClient);
      db.mevBoostGnosis.set(stakerConfig.enableMevBoost);
    case "prater":
      db.executionClientPrater.set(stakerConfig.executionClient);
      db.consensusClientPrater.set(stakerConfig.consensusClient);
      db.mevBoostPrater.set(stakerConfig.enableMevBoost);
    default:
      throw new Error("Unknown network");
  }
}

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
  isMevBoostSelected: boolean;
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
        mevBoostAvail: "mevboost.dnp.dappnode.eth",
        isMevBoostSelected: db.mevBoostMainnet.get()
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
        mevBoostAvail: "mevboost-gnosis.dnp.dappnode.eth",
        isMevBoostSelected: db.mevBoostGnosis.get()
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
        mevBoostAvail: "mevboost-prater.dnp.dappnode.eth",
        isMevBoostSelected: db.mevBoostPrater.get()
      };
    default:
      throw new Error(`Unknown network: ${network}`);
  }
}

/**
 * Get the validator service name.
 * Nimbus package is monoservice (beacon-validator)
 */
function getValidatorServiceName(dnpName: string): string {
  return dnpName.includes("nimbus") ? "validator" : "beacon-validator";
}
