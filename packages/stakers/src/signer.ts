import { Network, StakerItem } from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";

export class Signer extends StakerComponent {
  protected belongsToStakerNetwork = false;
  protected static readonly CompatibleSigners: Record<
    Network,
    { dnpName: string; minVersion: string }
  > = {
    [Network.Mainnet]: {
      dnpName: "web3signer.dnp.dappnode.eth",
      minVersion: "0.1.4",
    },
    [Network.Gnosis]: {
      dnpName: "web3signer-gnosis.dnp.dappnode.eth",
      minVersion: "0.1.10",
    },
    [Network.Prater]: {
      dnpName: "web3signer-prater.dnp.dappnode.eth",
      minVersion: "0.1.11",
    },
    [Network.Holesky]: {
      dnpName: "web3signer-holesky.dnp.dappnode.eth",
      minVersion: "0.1.0",
    },
    [Network.Lukso]: {
      dnpName: "web3signer-lukso.dnp.dappnode.eth",
      minVersion: "0.1.0",
    },
  };

  constructor(dappnodeInstaller: DappnodeInstaller) {
    super(dappnodeInstaller);
  }

  async getAllSigners(network: Network): Promise<StakerItem[]> {
    return await super.getAll({
      dnpNames: [Signer.CompatibleSigners[network].dnpName],
      currentClient: Signer.CompatibleSigners[network].dnpName,
    });
  }

  async setNewSigner(network: Network, newWeb3signerDnpName: string | null) {
    await super.setNew({
      newStakerDnpName: newWeb3signerDnpName,
      compatibleClients: [Signer.CompatibleSigners[network]],
      belongsToStakerNetwork: this.belongsToStakerNetwork,
    });
  }
}
