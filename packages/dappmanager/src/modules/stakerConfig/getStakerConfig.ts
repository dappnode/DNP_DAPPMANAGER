import { packagesGet } from "../../calls";
import { Network, PkgStatus, StakerConfigGet } from "../../types";
import { ComposeFileEditor } from "../compose/editor";
import {
  getBeaconServiceName,
  getNetworkStakerPkgs,
  getValidatorServiceName
} from "./utils";

/**
 * Fetches the current staker configuration:
 * - execution clients: isInstalled and isSelected
 * - consensus clients: isInstalled and isSelected
 * - web3signer: isInstalled and isSelected
 * - mevBoost: isInstalled and isSelected
 * - graffiti
 * - fee recipient address
 * - checkpoint sync url
 * @param network
 */
export async function getStakerConfig(
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
      const execClientPkg = pkgs.find(pkg => pkg.dnpName === exCl);
      executionClients.push({
        dnpName: exCl,
        isInstalled: execClientPkg ? true : false,
        isSelected: currentExecClient === exCl,
        isRunning: execClientPkg?.containers.every(c => c.running) ?? false
      });
    }

    // Consensus clients
    const consensusClients: PkgStatus[] = [];
    for (const conCl of consClientsAvail) {
      const consClientPkg = pkgs.find(pkg => pkg.dnpName === conCl);
      let graffiti = "";
      let feeRecipient = "";
      let checkpointSync = "";
      if (consClientPkg) {
        const environment = new ComposeFileEditor(
          consClientPkg.dnpName,
          consClientPkg.isCore
        ).getUserSettings().environment;
        if (environment) {
          const validatorService = getValidatorServiceName(
            consClientPkg.dnpName
          );
          const beaconService = getBeaconServiceName(consClientPkg.dnpName);
          graffiti = environment[validatorService]["GRAFFITI"];
          feeRecipient = environment[validatorService]["FEE_RECIPIENT_ADDRESS"];
          checkpointSync = environment[beaconService]["CHECKPOINT_SYNC_URL"];
        }
      }
      consensusClients.push({
        dnpName: conCl,
        isInstalled: consClientPkg ? true : false,
        isSelected: currentConsClient === conCl,
        isRunning: consClientPkg?.containers.every(c => c.running) ?? false,
        graffiti,
        feeRecipient,
        checkpointSync
      });
    }

    // Web3signer
    const web3signerPkg = pkgs.find(pkg => pkg.dnpName === web3signerAvail);
    const web3signer = {
      dnpName: web3signerAvail,
      isInstalled: web3signerPkg ? true : false,
      isSelected: web3signerPkg?.containers.every(c => c.running) ?? false, // Same value
      isRunning: web3signerPkg?.containers.every(c => c.running) ?? false
    };

    // Mevboost
    const mevBoostPkg = pkgs.find(pkg => pkg.dnpName === mevBoostAvail);
    const mevBoost = {
      dnpName: mevBoostAvail,
      isInstalled: mevBoostPkg ? true : false,
      isSelected: isMevBoostSelected,
      isRunning: mevBoostPkg?.containers.every(c => c.running) ?? false
    };

    return {
      executionClients,
      consensusClients,
      web3signer,
      mevBoost
    };
  } catch (e) {
    throw Error(`Error getting staker config: ${e}`);
  }
}
