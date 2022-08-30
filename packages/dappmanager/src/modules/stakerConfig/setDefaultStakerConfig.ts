import { Network } from "../../types";
import { getNetworkStakerPkgs } from "./utils";
import * as db from "../../db";
import { packagesGet } from "../../calls";
import { ComposeFileEditor } from "../compose/editor";

export async function setDefaultStakerConfig(): Promise<void> {
  const pkgs = await packagesGet();

  for (const network of ["mainnet", "gnosis", "prater"] as Network[]) {
    const stakerConfig = getNetworkStakerPkgs(network);

    // EXECUTION_CLIENT_<NETWORK>:
    // If the user has selected the repository full node option (geth-light should be considered as remote) then use this value.
    // If there is no repository full node option selected and there are execution client packages installed, choose one of them based on a given priority
    // If there is no repository full node option selected and there are no execution clients packages installed then set undefined
    if (stakerConfig.currentExecClient === null) {
      let newExexClientValue = "";

      for (const execClient of stakerConfig.execClientsAvail) {
        if (pkgs.find(pkg => pkg.dnpName === execClient)) {
          newExexClientValue = execClient;
          break;
        }
      }

      if (network === "mainnet") {
        const repository = db.ethClientTarget.get();
        if (repository === "nethermind")
          newExexClientValue = "nethermind.dnp.dappnode.eth";
        if (repository === "geth") newExexClientValue = "geth.dnp.dappnode.eth";
      }

      switch (network) {
        case "mainnet":
          db.executionClientMainnet.set(newExexClientValue);
          break;
        case "gnosis":
          db.executionClientGnosis.set(newExexClientValue);
          break;
        case "prater":
          db.executionClientPrater.set(newExexClientValue);
          break;
        default:
          break;
      }
    }

    // CONSENSUS_CLIENT_<NETWORK>:
    // If the web3signer is installed then grab the value from its compose ENV value
    // If not web3signer then is undefined
    if (stakerConfig.currentConsClient === null) {
      let newConsClientValue = "";

      const web3signerPkg = pkgs.find(
        pkg => pkg.dnpName === stakerConfig.web3signerAvail
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
          const eth2ClientDnpName = stakerConfig.consClientsAvail.find(
            dnpName => dnpName.includes(eth2Client)
          );
          if (!eth2ClientDnpName) break label;
          const eth2ClientPkg = pkgs.find(
            pkg => pkg.dnpName === eth2ClientDnpName
          );
          if (!eth2ClientPkg) break label;
          newConsClientValue = eth2ClientDnpName;
        }
      }

      switch (network) {
        case "mainnet":
          db.consensusClientMainnet.set(newConsClientValue);
          break;
        case "gnosis":
          db.consensusClientGnosis.set(newConsClientValue);
          break;
        case "prater":
          db.consensusClientPrater.set(newConsClientValue);
          break;
        default:
          break;
      }
    }
  }
}
