import { packagesGet } from "../../calls";
import { Network, PkgStatus, StakerConfigGet } from "../../types";
import { ComposeFileEditor } from "../compose/editor";
import { getNetworkStakerPkgs, getValidatorServiceName } from "./utils";

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
      executionClients.push({
        dnpName: exCl,
        isInstalled: pkgs.some(pkg => pkg.dnpName === exCl),
        isSelected: currentExecClient === exCl
      });
    }

    // Consensus clients
    const consensusClients: PkgStatus[] = [];
    for (const conCl of consClientsAvail) {
      const pkgInstalled = pkgs.find(pkg => pkg.dnpName === conCl);
      let graffiti = "";
      let feeRecipient = "";
      let checkpointSync = "";
      if (pkgInstalled) {
        const environment = new ComposeFileEditor(
          pkgInstalled.dnpName,
          pkgInstalled.isCore
        ).getUserSettings().environment;
        if (environment) {
          const validatorService = getValidatorServiceName(
            pkgInstalled.dnpName
          );
          graffiti = environment[validatorService]["GRAFFITI"];
          feeRecipient = environment[validatorService]["FEE_RECIPIENT_ADDRESS"];
          checkpointSync = environment[validatorService]["CHECKPOINT_SYNC_URL"];
        }
      }
      consensusClients.push({
        dnpName: conCl,
        isInstalled: pkgs.some(pkg => pkg.dnpName === conCl),
        isSelected: currentConsClient === conCl,
        graffiti,
        feeRecipient,
        checkpointSync
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
