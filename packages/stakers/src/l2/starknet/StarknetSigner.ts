import { Network, StakerItem, StarknetSigner as StarknetSignerEnum, UserSettings } from "@dappnode/types";
import { L2Component } from "../L2Component.js";
import { DappnodeInstaller } from "@dappnode/installer";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { CompatibleClient } from "../../core/BlockchainComponent.js";
import { listPackageNoThrow } from "@dappnode/dockerapi";

/**
 * StarknetSignerComponent manages the Starknet staking/signer package.
 * This is separate from the node and handles staking-related operations.
 */
export class StarknetSignerComponent extends L2Component {
  readonly DbHandler = db.starknetSigner;

  protected static readonly CompatibleSigners: CompatibleClient[] = [
    { dnpName: StarknetSignerEnum.StarknetStaking, minVersion: "0.1.0" }
  ];

  constructor(dappnodeInstaller: DappnodeInstaller) {
    super(dappnodeInstaller);
  }

  /**
   * Get all available Starknet signers
   */
  async getAllSigners(): Promise<StakerItem[]> {
    return await super.getAll({
      dnpNames: StarknetSignerComponent.CompatibleSigners.map((client) => client.dnpName),
      currentClient: this.DbHandler.get()
    });
  }

  /**
   * Persist the selected signer if it's installed and running
   */
  async persistSignerIfInstalledAndRunning(): Promise<void> {
    const signerDnpName = StarknetSignerComponent.CompatibleSigners[0]?.dnpName;
    if (!signerDnpName) return;

    const signerDnp = await listPackageNoThrow({ dnpName: signerDnpName });
    const isRunning = signerDnp?.containers.some((container) => container.running);

    if (isRunning) {
      const userSettings = this.getUserSettings();
      await this.setPkgConfig({ dnpName: signerDnpName, isInstalled: true, userSettings });
      await this.DbHandler.set(signerDnpName);
    }
  }

  /**
   * Set a new Starknet signer
   */
  async setNewSigner(newSignerDnpName: string | null): Promise<void> {
    const prevSignerDnpName = this.DbHandler.get();

    await super.setNewL2Client({
      newClientDnpName: newSignerDnpName,
      network: Network.Starknet,
      fullnodeAliases: [`signer.${Network.Starknet}.dncore.dappnode`],
      compatibleClients: StarknetSignerComponent.CompatibleSigners,
      userSettings: newSignerDnpName ? this.getUserSettings() : {},
      prevClient: prevSignerDnpName
    });

    // persist on db
    if (newSignerDnpName !== prevSignerDnpName) {
      await this.DbHandler.set(newSignerDnpName);
    }
  }

  private getUserSettings(): UserSettings {
    const serviceName = "starknetstaking"; // Main service name for starknet staking

    return {
      networks: {
        rootNetworks: this.getComposeRootNetworks(Network.Starknet),
        serviceNetworks: {
          [serviceName]: {
            [params.DOCKER_BLOCKCHAIN_NETWORKS[Network.Starknet]]: {
              aliases: [`signer.${Network.Starknet}.dappnode`, `staking.${Network.Starknet}.dappnode`]
            },
            [params.DOCKER_PRIVATE_NETWORK_NAME]: {
              aliases: [`signer.${Network.Starknet}.dncore.dappnode`, `staking.${Network.Starknet}.dncore.dappnode`]
            },
            [params.DOCKER_PRIVATE_NETWORK_NEW_NAME]: {
              aliases: [
                `signer.${Network.Starknet}.dappnode.private`,
                `staking.${Network.Starknet}.dappnode.private`
              ]
            }
          }
        }
      }
    };
  }
}
