import { Network, UserSettings } from "@dappnode/types";
import { BlockchainComponent, CompatibleClient } from "../core/BlockchainComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";
import { params } from "@dappnode/params";

/**
 * L2Component is the base class for Layer 2 blockchain components.
 * It extends BlockchainComponent with L2-specific functionality:
 * - L2 network aliases (*.l2.dappnode or similar)
 * - Simpler architecture (typically node + signer instead of consensus/execution split)
 *
 * L2s typically have:
 * - A single node package (e.g., Juno for Starknet) that handles both consensus and execution
 * - An optional signer package (e.g., starknetstaking)
 */
export class L2Component extends BlockchainComponent {
  constructor(dappnodeInstaller: DappnodeInstaller) {
    super(dappnodeInstaller);
  }

  /**
   * Get the compose root networks configuration for L2 packages
   * Includes the L2-specific network and the private DAppNode networks
   */
  protected override getComposeRootNetworks(network: Network): NonNullable<UserSettings["networks"]>["rootNetworks"] {
    return {
      [params.DOCKER_BLOCKCHAIN_NETWORKS[network]]: {
        external: true
      },
      [params.DOCKER_PRIVATE_NETWORK_NAME]: {
        external: true
      },
      [params.DOCKER_PRIVATE_NETWORK_NEW_NAME]: {
        external: true
      }
    };
  }

  /**
   * Build service network configuration with L2-specific aliases
   * Creates aliases for:
   * - *.{network}.dappnode (main network)
   * - *.{network}.dncore.dappnode (legacy private network)
   * - *.{network}.dappnode.private (new private network)
   */
  protected buildL2ServiceNetworks(
    network: Network,
    serviceName: string,
    aliases?: string[]
  ): NonNullable<UserSettings["networks"]>["serviceNetworks"] {
    const defaultAliases = aliases || [serviceName];

    return {
      [serviceName]: {
        [params.DOCKER_BLOCKCHAIN_NETWORKS[network]]: {
          aliases: defaultAliases.map((alias) => `${alias}.${network}.dappnode`)
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

  /**
   * Convenience method to set a new L2 client
   */
  protected async setNewL2Client({
    newClientDnpName,
    network,
    fullnodeAliases,
    compatibleClients,
    userSettings,
    prevClient
  }: {
    newClientDnpName: string | null | undefined;
    network: Network;
    fullnodeAliases: string[];
    compatibleClients: CompatibleClient[] | null;
    userSettings: UserSettings;
    prevClient?: string | null;
  }): Promise<void> {
    return super.setNew({
      newClientDnpName,
      dockerNetworkName: params.DOCKER_BLOCKCHAIN_NETWORKS[network],
      fullnodeAliases,
      compatibleClients,
      userSettings,
      prevClient
    });
  }
}
