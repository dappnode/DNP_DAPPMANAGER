import { InstalledPackageData, Network } from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";

export class Signer extends StakerComponent {
  protected network: Network;
  protected compatibleSigner: {
    dnpName: string;
    minVersion: string;
  };
  protected belongsToStakerNetwork = false;

  constructor(
    pkg: InstalledPackageData | null,
    dappnodeInstaller: DappnodeInstaller,
    network: Network
  ) {
    super(pkg, dappnodeInstaller);
    this.network = network;
    this.compatibleSigner = this.getCompatibleSigner();
  }

  async setNewSigner(newExecutionDnpName: string | null) {
    await super.setNew({
      newStakerDnpName: newExecutionDnpName,
      compatibleClients: [this.compatibleSigner],
      belongsToStakerNetwork: this.belongsToStakerNetwork,
    });
  }

  private getCompatibleSigner(): {
    dnpName: string;
    minVersion: string;
  } {
    switch (this.network) {
      case "mainnet":
        return {
          dnpName: "web3signer.dnp.dappnode.eth",
          minVersion: "0.1.4",
        };
      case "gnosis":
        return {
          dnpName: "web3signer-gnosis.dnp.dappnode.eth",
          minVersion: "0.1.10",
        };
      case "prater":
        return {
          dnpName: "web3signer-prater.dnp.dappnode.eth",
          minVersion: "0.1.11",
        };
      case "holesky":
        return {
          dnpName: "web3signer-holesky.dnp.dappnode.eth",
          minVersion: "0.1.0",
        };
      case "lukso":
        return {
          dnpName: "web3signer-lukso.dnp.dappnode.eth",
          minVersion: "0.1.0",
        };
      default:
        throw Error(`Unsupported network: ${this.network}`);
    }
  }
}
