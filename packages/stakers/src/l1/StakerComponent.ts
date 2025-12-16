import { Network, UserSettings } from "@dappnode/types";
import { BlockchainComponent, CompatibleClient } from "../core/BlockchainComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";
import { params } from "@dappnode/params";

/**
 * StakerComponent is the base class for L1 Proof-of-Stake blockchain components.
 * It extends BlockchainComponent with L1-staking-specific functionality:
 * - Staker network aliases (*.staker.dappnode)
 * - Multi-network configuration (staker network + dncore networks)
 *
 * Used by: Consensus, Execution, MevBoost, Signer
 */
export class StakerComponent extends BlockchainComponent {
  constructor(dappnodeInstaller: DappnodeInstaller) {
    super(dappnodeInstaller);
  }

  /**
   * Wrapper for setNew that uses "staker" terminology for backward compatibility
   * @deprecated Use setNew from BlockchainComponent directly for new implementations
   */
  protected async setNewStaker({
    newStakerDnpName,
    dockerNetworkName,
    fullnodeAliases,
    compatibleClients,
    userSettings,
    prevClient
  }: {
    newStakerDnpName: string | null | undefined;
    dockerNetworkName: string;
    fullnodeAliases: string[];
    compatibleClients: CompatibleClient[] | null;
    userSettings: UserSettings;
    prevClient?: string | null;
  }): Promise<void> {
    return super.setNew({
      newClientDnpName: newStakerDnpName,
      dockerNetworkName,
      fullnodeAliases,
      compatibleClients,
      userSettings,
      prevClient
    });
  }

  /**
   * Wrapper for setPkgConfig that uses "staker" terminology for backward compatibility
   * @deprecated Use setPkgConfig from BlockchainComponent directly for new implementations
   */
  protected async setStakerPkgConfig({
    dnpName,
    isInstalled,
    userSettings
  }: {
    dnpName: string;
    isInstalled: boolean;
    userSettings: UserSettings;
  }): Promise<void> {
    return super.setPkgConfig({ dnpName, isInstalled, userSettings });
  }

  /**
   * Get the compose root networks configuration for L1 staker packages
   * Includes both the staker-specific network and the private network
   */
  protected override getComposeRootNetworks(network: Network): NonNullable<UserSettings["networks"]>["rootNetworks"] {
    return {
      [params.DOCKER_BLOCKCHAIN_NETWORKS[network]]: {
        external: true
      },
      [params.DOCKER_PRIVATE_NETWORK_NAME]: {
        external: true
      }
    };
  }

  /**
   * Build service network configuration with staker-specific aliases
   * Creates aliases for:
   * - *.{network}.staker.dappnode (staker network)
   * - *.{network}.dncore.dappnode (legacy private network)
   * - *.{network}.dappnode.private (new private network)
   */
  protected buildStakerServiceNetworks(
    network: Network,
    serviceName: string,
    aliases?: string[]
  ): NonNullable<UserSettings["networks"]>["serviceNetworks"] {
    const defaultAliases = aliases || [serviceName];

    return {
      [serviceName]: {
        [params.DOCKER_BLOCKCHAIN_NETWORKS[network]]: {
          aliases: defaultAliases.map((alias) => `${alias}.${network}.staker.dappnode`)
        },
        [params.DOCKER_PRIVATE_NETWORK_NAME]: {
          aliases: defaultAliases.map((alias) => `${alias}.${network}.dncore.dappnode`)
        },
        [params.DOCKER_PRIVATE_NETWORK_NEW_NAME]: {
          aliases: defaultAliases.map((alias) => `${alias}.${network}.dappnode.private`)
        }
      }
    };
  }
}
