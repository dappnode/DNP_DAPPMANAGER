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
      execClients,
      currentExecClient,
      consClients,
      currentConsClient,
      web3signer,
      mevBoostAvail,
      isMevBoostSelected
    } = getNetworkStakerPkgs(network);

    const pkgs = await packagesGet();

    // Execution clients
    const executionClients: PkgStatus[] = [];
    for (const exCl of execClients.map(exexClient => exexClient.dnpName)) {
      const execClientPkg = pkgs.find(pkg => pkg.dnpName === exCl);
      executionClients.push({
        dnpName: exCl,
        isInstalledAndRunning:
          execClientPkg?.containers.every(c => c.running) ?? false,
        isSelected: currentExecClient === exCl
      });
    }

    // Consensus clients
    const consensusClients: PkgStatus[] = [];
    for (const conCl of consClients.map(consClient => consClient.dnpName)) {
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
        isInstalledAndRunning:
          consClientPkg?.containers.every(c => c.running) ?? false,
        isSelected: currentConsClient === conCl,
        graffiti,
        feeRecipient,
        checkpointSync
      });
    }

    // Web3signer
    const web3signerPkg = pkgs.find(pkg => pkg.dnpName === web3signer.dnpName);
    const web3signerPkgIsInstalledAndRunning =
      web3signerPkg?.containers.every(c => c.running) ?? false;
    const signer = {
      dnpName: web3signer.dnpName,
      isInstalledAndRunning: web3signerPkgIsInstalledAndRunning,
      isSelected: web3signerPkgIsInstalledAndRunning
    };

    // Mevboost
    const mevBoostPkg = pkgs.find(pkg => pkg.dnpName === mevBoostAvail);
    const mevBoost = {
      dnpName: mevBoostAvail,
      isInstalledAndRunning:
        mevBoostPkg?.containers.every(c => c.running) ?? false,
      isSelected: isMevBoostSelected
    };

    return {
      executionClients,
      consensusClients,
      web3signer: signer,
      mevBoost
    };
  } catch (e) {
    throw Error(`Error getting staker config: ${e}`);
  }
}
