import {
  Network,
  SignerGnosis,
  SignerHolesky,
  SignerLukso,
  SignerMainnet,
  SignerPrater,
  StakerItem,
} from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";
import { params } from "@dappnode/params";

export class Signer extends StakerComponent {
  protected static readonly BelongsToStakerNetwork = false;
  protected static readonly CompatibleSigners: Record<
    Network,
    { dnpName: string; minVersion: string }
  > = {
    [Network.Mainnet]: {
      dnpName: SignerMainnet.Web3signer,
      minVersion: "0.1.4",
    },
    [Network.Gnosis]: {
      dnpName: SignerGnosis.Web3signer,
      minVersion: "0.1.10",
    },
    [Network.Prater]: {
      dnpName: SignerPrater.Web3signer,
      minVersion: "0.1.11",
    },
    [Network.Holesky]: {
      dnpName: SignerHolesky.Web3signer,
      minVersion: "0.1.0",
    },
    [Network.Lukso]: {
      dnpName: SignerLukso.Web3signer,
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
      dockerNetworkName: params.DOCKER_STAKER_NETWORKS[network],
      compatibleClients: [Signer.CompatibleSigners[network]],
      belongsToStakerNetwork: Signer.BelongsToStakerNetwork,
    });
  }
}
