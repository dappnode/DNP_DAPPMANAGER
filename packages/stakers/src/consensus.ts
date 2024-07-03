import {
  ComposeServiceNetworksObj,
  ConsensusClientGnosis,
  ConsensusClientHolesky,
  ConsensusClientLukso,
  ConsensusClientMainnet,
  ConsensusClientPrater,
  Network,
  StakerItem,
  UserSettings,
  UserSettingsAllDnps,
} from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";
import * as db from "@dappnode/db";
import { listPackageNoThrow } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";

// TODO: move ethereumClient logic here

export class Consensus extends StakerComponent {
  readonly DbHandlers: Record<
    Network,
    {
      get: () => string | null | undefined;
      set: (globEnvValue: string | null | undefined) => Promise<void>;
    }
  > = {
    [Network.Mainnet]: db.consensusClientMainnet,
    [Network.Gnosis]: db.consensusClientGnosis,
    [Network.Prater]: db.consensusClientPrater,
    [Network.Holesky]: db.consensusClientHolesky,
    [Network.Lukso]: db.consensusClientLukso,
  };
  protected static readonly DefaultCheckpointSync: Record<Network, string> = {
    [Network.Mainnet]: "https://checkpoint-sync.dappnode.io",
    [Network.Prater]: "https://checkpoint-sync-prater.dappnode.io",
    [Network.Gnosis]: "https://checkpoint-sync-gnosis.dappnode.io",
    [Network.Holesky]: "https://checkpoint-sync-holesky.dappnode.io",
    [Network.Lukso]: "https://checkpoints.mainnet.lukso.network",
  };
  protected static readonly CompatibleConsensus: Record<
    Network,
    { dnpName: string; minVersion: string }[]
  > = {
    [Network.Mainnet]: [
      { dnpName: ConsensusClientMainnet.Prysm, minVersion: "3.0.4" },
      { dnpName: ConsensusClientMainnet.Lighthouse, minVersion: "1.0.3" },
      { dnpName: ConsensusClientMainnet.Teku, minVersion: "2.0.4" },
      { dnpName: ConsensusClientMainnet.Nimbus, minVersion: "1.0.5" },
      { dnpName: ConsensusClientMainnet.Lodestar, minVersion: "0.1.0" },
    ],
    [Network.Gnosis]: [
      { dnpName: ConsensusClientGnosis.Lighthouse, minVersion: "0.1.5" },
      { dnpName: ConsensusClientGnosis.Teku, minVersion: "0.1.5" },
      { dnpName: ConsensusClientGnosis.Lodestar, minVersion: "0.1.0" },
      { dnpName: ConsensusClientGnosis.Nimbus, minVersion: "0.1.0" },
    ],
    [Network.Prater]: [
      { dnpName: ConsensusClientPrater.Prysm, minVersion: "1.0.15" },
      { dnpName: ConsensusClientPrater.Lighthouse, minVersion: "0.1.9" },
      { dnpName: ConsensusClientPrater.Teku, minVersion: "0.1.10" },
      { dnpName: ConsensusClientPrater.Nimbus, minVersion: "0.1.7" },
      { dnpName: ConsensusClientPrater.Lodestar, minVersion: "0.1.0" },
    ],
    [Network.Holesky]: [
      { dnpName: ConsensusClientHolesky.Lighthouse, minVersion: "0.1.2" },
      { dnpName: ConsensusClientHolesky.Prysm, minVersion: "0.1.3" },
      { dnpName: ConsensusClientHolesky.Teku, minVersion: "0.1.2" },
      { dnpName: ConsensusClientHolesky.Nimbus, minVersion: "0.1.2" },
      { dnpName: ConsensusClientHolesky.Lodestar, minVersion: "0.1.3" },
    ],
    [Network.Lukso]: [
      { dnpName: ConsensusClientLukso.Prysm, minVersion: "0.1.0" },
      { dnpName: ConsensusClientLukso.Teku, minVersion: "0.1.0" },
    ],
  };

  constructor(dappnodeInstaller: DappnodeInstaller) {
    super(dappnodeInstaller);
  }

  async getAllConsensus(network: Network): Promise<StakerItem[]> {
    return await super.getAll({
      dnpNames: Consensus.CompatibleConsensus[network].map(
        (client) => client.dnpName
      ),
      currentClient: this.DbHandlers[network].get(),
    });
  }

  async persistSelectedConsensusIfInstalled(network: Network): Promise<void> {
    const currentConsensusDnpName = this.DbHandlers[network].get();
    if (
      currentConsensusDnpName &&
      (await listPackageNoThrow({ dnpName: currentConsensusDnpName }))
    )
      await this.persistSelectedIfInstalled(
        currentConsensusDnpName,
        this.getUserSettings(currentConsensusDnpName, true, network)
      );
  }

  async setNewConsensus(network: Network, newConsensusDnpName: string | null) {
    const prevConsClientDnpName = this.DbHandlers[network].get();

    await super.setNew({
      newStakerDnpName: newConsensusDnpName,
      dockerNetworkName: params.DOCKER_STAKER_NETWORKS[network],
      compatibleClients: Consensus.CompatibleConsensus[network],
      userSettings: this.getUserSettings(
        newConsensusDnpName,
        prevConsClientDnpName === newConsensusDnpName,
        network
      ),
      prevClient: prevConsClientDnpName,
    });
    // persist on db
    if (newConsensusDnpName !== prevConsClientDnpName)
      await this.DbHandlers[network].set(newConsensusDnpName);
  }

  private getUserSettings(
    newConsensusDnpName: string | null,
    prevAndNewAreSame: boolean, // used to avoid overwriting consensus envs
    network: Network
  ): UserSettings {
    const validatorServiceName =
      this.getValidatorServiceName(newConsensusDnpName);
    const beaconServiceName = this.getBeaconServiceName(newConsensusDnpName);
    const defaultDappnodeGraffiti = "validating_from_DAppNode";
    const defaultFeeRecipient = "0x0000000000000000000000000000000000000000";
    return newConsensusDnpName
      ? {
          [newConsensusDnpName]: {
            environment: prevAndNewAreSame
              ? beaconServiceName === validatorServiceName
                ? {
                    [validatorServiceName]: {
                      // Fee recipient is set as global env, keep this for backwards compatibility
                      ["FEE_RECIPIENT_ADDRESS"]: defaultFeeRecipient, // TODO: consider setting the MEV fee recipient as the default
                      // Graffiti is a mandatory value
                      ["GRAFFITI"]: defaultDappnodeGraffiti,
                      // Checkpoint sync is an optional value
                      ["CHECKPOINT_SYNC_URL"]:
                        Consensus.DefaultCheckpointSync[network],
                    },
                  }
                : {
                    [validatorServiceName]: {
                      // Fee recipient is set as global env, keep this for backwards compatibility
                      ["FEE_RECIPIENT_ADDRESS"]: defaultFeeRecipient,
                      // Graffiti is a mandatory value
                      ["GRAFFITI"]: defaultDappnodeGraffiti,
                    },

                    [beaconServiceName]: {
                      // Fee recipient is set as global env, keep this for backwards compatibility
                      ["FEE_RECIPIENT_ADDRESS"]: defaultFeeRecipient,
                      // Checkpoint sync is an optional value
                      ["CHECKPOINT_SYNC_URL"]:
                        Consensus.DefaultCheckpointSync[network],
                    },
                  }
              : {},
            networks:
              beaconServiceName === validatorServiceName
                ? {
                    rootNetworks: {
                      [params.DOCKER_STAKER_NETWORKS[network]]: {
                        external: true,
                      },
                      [params.DOCKER_PRIVATE_NETWORK_NAME]: {
                        external: true,
                      },
                    },
                    serviceNetworks: {
                      ["beacon-validator"]: {
                        [params.DOCKER_STAKER_NETWORKS[network]]: {
                          aliases: [
                            `beacon-chain.${network}.staker.dappnode`,
                            `validator.${network}.staker.dappnode`,
                          ],
                        },
                        [params.DOCKER_PRIVATE_NETWORK_NAME]: {
                          aliases: [
                            `beacon-chain.${network}.dncore.dappnode`,
                            `validator.${network}.dncore.dappnode`,
                          ],
                        },
                      },
                    },
                  }
                : {
                    rootNetworks: {
                      [params.DOCKER_STAKER_NETWORKS[network]]: {
                        external: true,
                      },
                      [params.DOCKER_PRIVATE_NETWORK_NAME]: {
                        external: true,
                      },
                    },
                    serviceNetworks: {
                      ["beacon-chain"]: {
                        [params.DOCKER_STAKER_NETWORKS[network]]: {
                          aliases: [`beacon-chain.${network}.staker.dappnode`],
                        },
                        [params.DOCKER_PRIVATE_NETWORK_NAME]: {
                          aliases: [`beacon-chain.${network}.dncore.dappnode`],
                        },
                      },
                      ["validator"]: {
                        [params.DOCKER_STAKER_NETWORKS[network]]: {
                          aliases: [`validator.${network}.staker.dappnode`],
                        },
                        [params.DOCKER_PRIVATE_NETWORK_NAME]: {
                          aliases: [`validator.${network}.dncore.dappnode`],
                        },
                      },
                    },
                  },
          },
        }
      : {};
  }

  /**
   * Get the validator service name.
   * - Nimbus package is monoservice (beacon-validator)
   * - Prysm, Teku, Lighthouse, and Lodestar are multiservice (beacon, validator)
   */
  private getValidatorServiceName(newConsensusDnpName: string | null): string {
    return newConsensusDnpName
      ? newConsensusDnpName.includes("nimbus")
        ? "beacon-validator"
        : "validator"
      : "";
  }

  /**
   * Get the beacon service name
   * - Nimbus package is monoservice (beacon-validator)
   * - Prysm, Teku, Lighthouse, and Lodestar are multiservice (beacon, validator)
   */
  private getBeaconServiceName(newConsensusDnpName: string | null): string {
    return newConsensusDnpName
      ? newConsensusDnpName.includes("nimbus")
        ? "beacon-validator"
        : "beacon-chain"
      : "";
  }
}
