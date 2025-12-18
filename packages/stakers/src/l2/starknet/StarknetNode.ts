import { Network, StakerItem, StarknetNode as StarknetNodeEnum, UserSettings } from "@dappnode/types";
import { L2Component } from "../L2Component.js";
import { DappnodeInstaller } from "@dappnode/installer";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { CompatibleClient } from "../../core/BlockchainComponent.js";

/**
 * StarknetNodeComponent manages the Starknet node package (Juno).
 * Juno is a full node for Starknet that handles both consensus and execution-like functionality.
 */
export class StarknetNodeComponent extends L2Component {
  readonly DbHandler = db.starknetNode;

  protected static readonly CompatibleNodes: CompatibleClient[] = [
    { dnpName: StarknetNodeEnum.Juno, minVersion: "0.1.0" }
  ];

  constructor(dappnodeInstaller: DappnodeInstaller) {
    super(dappnodeInstaller);
  }

  /**
   * Get all available Starknet node clients
   */
  async getAllNodes(): Promise<StakerItem[]> {
    return await super.getAll({
      dnpNames: StarknetNodeComponent.CompatibleNodes.map((client) => client.dnpName),
      currentClient: this.DbHandler.get()
    });
  }

  /**
   * Persist the selected node if it's installed
   */
  async persistSelectedNodeIfInstalled(): Promise<void> {
    const currentNodeDnpName = this.DbHandler.get();
    if (currentNodeDnpName) {
      const isInstalled = await this.isPackageInstalled(currentNodeDnpName);

      if (!isInstalled) {
        await this.DbHandler.set(undefined);
        return;
      }

      const userSettings = this.getUserSettings();
      await this.setPkgConfig({ dnpName: currentNodeDnpName, isInstalled, userSettings });
      await this.DbHandler.set(currentNodeDnpName);
    }
  }

  /**
   * Set a new Starknet node
   */
  async setNewNode(newNodeDnpName: string | null): Promise<void> {
    const prevNodeDnpName = this.DbHandler.get();

    await super.setNewL2Client({
      newClientDnpName: newNodeDnpName,
      network: Network.Starknet,
      fullnodeAliases: [`node.${Network.Starknet}.dncore.dappnode`],
      compatibleClients: StarknetNodeComponent.CompatibleNodes,
      userSettings: newNodeDnpName ? this.getUserSettings() : {},
      prevClient: prevNodeDnpName
    });

    // persist on db
    if (newNodeDnpName !== prevNodeDnpName) {
      await this.DbHandler.set(newNodeDnpName);
    }
  }

  private getUserSettings(): UserSettings {
    const serviceName = "juno"; // Juno's main service name

    return {
      networks: {
        rootNetworks: this.getComposeRootNetworks(Network.Starknet),
        serviceNetworks: {
          [serviceName]: {
            [params.DOCKER_BLOCKCHAIN_NETWORKS[Network.Starknet]]: {
              aliases: [`node.${Network.Starknet}.dappnode`, `juno.${Network.Starknet}.dappnode`]
            },
            [params.DOCKER_PRIVATE_NETWORK_NAME]: {
              aliases: [`node.${Network.Starknet}.dncore.dappnode`, `juno.${Network.Starknet}.dncore.dappnode`]
            },
            [params.DOCKER_PRIVATE_NETWORK_NEW_NAME]: {
              aliases: [`node.${Network.Starknet}.dappnode.private`, `juno.${Network.Starknet}.dappnode.private`]
            }
          }
        }
      }
    };
  }
}
