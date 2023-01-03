import {
  ConsensusClientGnosis,
  ConsensusClientMainnet,
  ConsensusClientPrater,
  ExecutionClientGnosis,
  ExecutionClientMainnet,
  ExecutionClientPrater,
  InstalledPackageDataApiReturn,
  Network
} from "@dappnode/common";
import * as db from "../../db";
import { packagesGet } from "../../calls";
import { ComposeFileEditor } from "../compose/editor";
import { stakerParamsByNetwork } from "../stakerConfig/stakerParamsByNetwork";

/**
 * Sets default values for the global environment variables:
 * - _DAPPNODE_GLOBAL_EXECUTION_CLIENT_<NETWORK>
 * - _DAPPNODE_GLOBAL_CONSENSUS_CLIENT_<NETWORK>
 *
 * Based on:
 * - Web3siger package installed and ETH2_CLIENT selected at that moment
 * - Full Eth repository selected
 * - Execution and/or consensus clients installed
 */
export async function setDefaultStakerConfig(): Promise<void> {
  const pkgs = await packagesGet();

  for (const network of ["mainnet", "gnosis", "prater"] as Network[]) {
    const stakerConfig = stakerParamsByNetwork(network);

    // EXECUTION_CLIENT_<NETWORK>:
    // If the user has selected the repository full node option then use this value.
    // If there is no repository full node option selected and there are execution client packages installed, choose one of them based on a given priority
    // If there is no repository full node option selected and there are no execution clients packages installed then set undefined
    if (!stakerConfig.currentExecClient) {
      // Set default empty string value
      let newExexClientValue = "";

      if (network === "mainnet") {
        // Look for pkg ethclient target (fullnode), installed and running
        const execClientTargetDnpName = getExecClientTargetDnpName();
        if (
          pkgs.find(
            pkg =>
              pkg.dnpName === execClientTargetDnpName &&
              pkg.containers.every(c => c.running)
          )
        ) {
          newExexClientValue = execClientTargetDnpName;
        }
      }

      if (
        (network === "mainnet" || network === "gnosis") &&
        !newExexClientValue
      ) {
        // Look for pkg exec client installed and running
        newExexClientValue = getClientInstalledAndRunning(
          pkgs,
          stakerConfig.execClients.map(client => client.dnpName)
        );
        // Look for pkg exec client installed
        if (!newExexClientValue)
          newExexClientValue = getClientInstalled(
            pkgs,
            stakerConfig.execClients.map(client => client.dnpName)
          );
      }

      switch (network) {
        case "mainnet":
          db.executionClientMainnet.set(
            newExexClientValue as ExecutionClientMainnet
          );
          break;
        case "gnosis":
          db.executionClientGnosis.set(
            newExexClientValue as ExecutionClientGnosis
          );
          break;
        case "prater":
          db.executionClientPrater.set(
            newExexClientValue as ExecutionClientPrater
          );
          break;
        default:
          break;
      }
    }

    // CONSENSUS_CLIENT_<NETWORK>:
    // If the web3signer is installed then grab the value from its compose ENV value
    // If not web3signer then is undefined
    if (!stakerConfig.currentConsClient) {
      // Set default empty string value
      let newConsClientValue = "";

      const web3signerPkg = pkgs.find(
        pkg => pkg.dnpName === stakerConfig.web3signer.dnpName
      );

      label: if (web3signerPkg) {
        // Get the env value from ETH2_CLIENT
        const environment = new ComposeFileEditor(
          web3signerPkg.dnpName,
          web3signerPkg.isCore
        ).getUserSettings().environment;
        if (
          environment &&
          "web3signer" in environment &&
          "ETH2_CLIENT" in environment.web3signer
        ) {
          const eth2Client = environment["web3signer"]["ETH2_CLIENT"];
          const eth2ClientDnpName = stakerConfig.consClients
            .map(cCl => cCl.dnpName)
            .find(dnpName => dnpName.includes(eth2Client));
          if (!eth2ClientDnpName) break label;
          const eth2ClientPkg = pkgs.find(
            pkg => pkg.dnpName === eth2ClientDnpName
          );
          if (!eth2ClientPkg) break label;
          newConsClientValue = eth2ClientDnpName;
        }
      }

      // For resilience, give a value for mainnet if its still empty
      if (
        (network === "mainnet" || network === "gnosis") &&
        !newConsClientValue
      ) {
        // Look for cons client installed and running
        newConsClientValue = getClientInstalledAndRunning(
          pkgs,
          stakerConfig.consClients.map(client => client.dnpName)
        );
        // Look for cons client installed
        if (!newConsClientValue)
          newConsClientValue = getClientInstalled(
            pkgs,
            stakerConfig.consClients.map(client => client.dnpName)
          );
      }

      switch (network) {
        case "mainnet":
          db.consensusClientMainnet.set(
            newConsClientValue as ConsensusClientMainnet
          );
          break;
        case "gnosis":
          db.consensusClientGnosis.set(
            newConsClientValue as ConsensusClientGnosis
          );
          break;
        case "prater":
          db.consensusClientPrater.set(
            newConsClientValue as ConsensusClientPrater
          );
          break;
        default:
          break;
      }
    }
  }
}

// Utils

function getClientInstalledAndRunning(
  pkgs: InstalledPackageDataApiReturn[],
  clients: string[]
): string {
  for (const client of clients) {
    if (
      pkgs.find(
        pkg => pkg.dnpName === client && pkg.containers.every(c => c.running)
      )
    )
      return client;
  }
  return "";
}

function getClientInstalled(
  pkgs: InstalledPackageDataApiReturn[],
  clients: string[]
): string {
  for (const client of clients) {
    if (pkgs.find(pkg => pkg.dnpName === client)) return client;
  }
  return "";
}

function getExecClientTargetDnpName(): ExecutionClientMainnet {
  const repository = db.ethClientTarget.get();
  switch (repository) {
    case "geth":
      return "geth.dnp.dappnode.eth";
    case "nethermind":
      return "nethermind.public.dappnode.eth";
    case "besu":
      return "besu.public.dappnode.eth";
    case "erigon":
      return "erigon.dnp.dappnode.eth";
    default:
      return "";
  }
}
