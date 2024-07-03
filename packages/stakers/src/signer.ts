import {
  ComposeServiceNetworksObj,
  Network,
  SignerGnosis,
  SignerHolesky,
  SignerLukso,
  SignerMainnet,
  SignerPrater,
  StakerItem,
  UserSettings,
} from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";
import { params } from "@dappnode/params";
import { listPackageNoThrow } from "@dappnode/dockerapi";

export class Signer extends StakerComponent {
  protected static readonly ServiceAliasesMap: Record<string, string[]> = {};

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

  async persistSignerIfInstalledAndRunning(network: Network): Promise<void> {
    if (
      (
        await listPackageNoThrow({
          dnpName: Signer.CompatibleSigners[network].dnpName,
        })
      )?.containers.some((container) => container.running)
    )
      await this.persistSelectedIfInstalled(
        Signer.CompatibleSigners[network].dnpName,
        this.getUserSettings(network)
      );
  }

  async setNewSigner(network: Network, newWeb3signerDnpName: string | null) {
    await super.setNew({
      newStakerDnpName: newWeb3signerDnpName,
      dockerNetworkName: params.DOCKER_STAKER_NETWORKS[network],
      compatibleClients: [Signer.CompatibleSigners[network]],
      userSettings: this.getUserSettings(network),
      prevClient: Signer.CompatibleSigners[network].dnpName,
    });
  }

  private getUserSettings(network: Network): UserSettings {
    return {
      networks: {
        rootNetworks: {
          [params.DOCKER_STAKER_NETWORKS[network]]: {
            external: true,
          },
          [params.DOCKER_PRIVATE_NETWORK_NAME]: {
            external: true,
          },
        },
        serviceNetworks: {
          web3signer: {
            [params.DOCKER_STAKER_NETWORKS[network]]: {
              aliases: [`signer.${network}.staker.dappnode`],
            },
            [params.DOCKER_PRIVATE_NETWORK_NAME]: {
              aliases: [`signer.${network}.dncore.dappnode`],
            },
          },
        },
      },
    };
  }
}
