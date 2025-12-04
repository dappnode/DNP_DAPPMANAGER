import {
  Network,
  SignerGnosis,
  SignerHolesky,
  SignerHoodi,
  SignerLukso,
  SignerMainnet,
  SignerPrater,
  SignerSepolia,
  SignerStarknetMainnet,
  SignerStarknetSepolia,
  StakerItem,
  UserSettings
} from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";
import { params } from "@dappnode/params";
import { listPackageNoThrow } from "@dappnode/dockerapi";

export class Signer extends StakerComponent {
  protected static readonly ServiceAliasesMap: Record<string, string[]> = {};

  protected static readonly CompatibleSigners: Record<Network, { dnpName: string; minVersion: string }> = {
    [Network.Mainnet]: {
      dnpName: SignerMainnet.Web3signer,
      minVersion: "0.1.4"
    },
    [Network.Gnosis]: {
      dnpName: SignerGnosis.Web3signer,
      minVersion: "0.1.10"
    },
    [Network.Prater]: {
      dnpName: SignerPrater.Web3signer,
      minVersion: "0.1.11"
    },
    [Network.Holesky]: {
      dnpName: SignerHolesky.Web3signer,
      minVersion: "0.1.0"
    },
    [Network.Hoodi]: {
      dnpName: SignerHoodi.Web3signer,
      minVersion: "0.1.0"
    },
    [Network.Lukso]: {
      dnpName: SignerLukso.Web3signer,
      minVersion: "0.1.0"
    },
    [Network.Sepolia]: {
      dnpName: SignerSepolia.Web3signer, 
      minVersion: "0.1.0"
    },
    [Network.StarknetMainnet]: {
      dnpName: SignerStarknetMainnet.Web3signer,
      minVersion: "0.1.0"
    },
    [Network.StarknetSepolia]: {
      dnpName: SignerStarknetSepolia.Web3signer,
      minVersion: "0.1.0"
    }
  };

  constructor(dappnodeInstaller: DappnodeInstaller) {
    super(dappnodeInstaller);
  }

  async getAllSigners(network: Network): Promise<StakerItem[]> {
    return await super.getAll({
      dnpNames: [Signer.CompatibleSigners[network].dnpName],
      currentClient: Signer.CompatibleSigners[network].dnpName
    });
  }

  async persistSignerIfInstalledAndRunning(network: Network): Promise<void> {
    const signerDnpName = Signer.CompatibleSigners[network].dnpName;
    const signerDnp = await listPackageNoThrow({ dnpName: signerDnpName });
    const isRunning = signerDnp?.containers.some((container) => container.running);

    if (isRunning) {
      const dnpName = Signer.CompatibleSigners[network].dnpName;
      const userSettings = this.getUserSettings(network);

      await this.setStakerPkgConfig({ dnpName, isInstalled: true, userSettings });
    }
  }

  async setNewSigner(network: Network, newWeb3signerDnpName: string | null) {
    await super.setNew({
      newStakerDnpName: newWeb3signerDnpName,
      dockerNetworkName: params.DOCKER_STAKER_NETWORKS[network],
      fullnodeAliases: [`signer.${network}.dncore.dappnode`],
      compatibleClients: [Signer.CompatibleSigners[network]],
      userSettings: this.getUserSettings(network),
      prevClient: Signer.CompatibleSigners[network].dnpName
    });
  }

  private getUserSettings(network: Network): UserSettings {
    const serviceName = "web3signer";

    return {
      networks: {
        rootNetworks: this.getComposeRootNetworks(network),
        serviceNetworks: {
          [serviceName]: {
            [params.DOCKER_STAKER_NETWORKS[network]]: {
              aliases: [`${serviceName}.${network}.staker.dappnode`, `signer.${network}.staker.dappnode`]
            },
            [params.DOCKER_PRIVATE_NETWORK_NAME]: {
              aliases: [`${serviceName}.${network}.dncore.dappnode`, `signer.${network}.dncore.dappnode`]
            },
            [params.DOCKER_PRIVATE_NETWORK_NEW_NAME]: {
              aliases: [`${serviceName}.${network}.dappnode.private`, `signer.${network}.dappnode.private`]
            }
          }
        }
      }
    };
  }
}
