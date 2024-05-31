import { Network, StakerItem, UserSettingsAllDnps } from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";
import * as db from "@dappnode/db";

export class Consensus extends StakerComponent {
  protected belongsToStakerNetwork = true;
  protected static readonly DbHandlers: Record<
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
      { dnpName: "prysm.dnp.dappnode.eth", minVersion: "3.0.4" },
      { dnpName: "lighthouse.dnp.dappnode.eth", minVersion: "1.0.3" },
      { dnpName: "teku.dnp.dappnode.eth", minVersion: "2.0.4" },
      { dnpName: "nimbus.dnp.dappnode.eth", minVersion: "1.0.5" },
      { dnpName: "lodestar.dnp.dappnode.eth", minVersion: "0.1.0" },
    ],
    [Network.Gnosis]: [
      { dnpName: "lighthouse-gnosis.dnp.dappnode.eth", minVersion: "0.1.5" },
      { dnpName: "teku-gnosis.dnp.dappnode.eth", minVersion: "0.1.5" },
      { dnpName: "lodestar-gnosis.dnp.dappnode.eth", minVersion: "0.1.0" },
      { dnpName: "nimbus-gnosis.dnp.dappnode.eth", minVersion: "0.1.0" },
    ],
    [Network.Prater]: [
      { dnpName: "prysm-prater.dnp.dappnode.eth", minVersion: "1.0.15" },
      { dnpName: "lighthouse-prater.dnp.dappnode.eth", minVersion: "0.1.9" },
      { dnpName: "teku-prater.dnp.dappnode.eth", minVersion: "0.1.10" },
      { dnpName: "nimbus-prater.dnp.dappnode.eth", minVersion: "0.1.7" },
      { dnpName: "lodestar-prater.dnp.dappnode.eth", minVersion: "0.1.0" },
    ],
    [Network.Holesky]: [
      { dnpName: "lighthouse-holesky.dnp.dappnode.eth", minVersion: "0.1.2" },
      { dnpName: "prysm-holesky.dnp.dappnode.eth", minVersion: "0.1.3" },
      { dnpName: "teku-holesky.dnp.dappnode.eth", minVersion: "0.1.2" },
      { dnpName: "nimbus-holesky.dnp.dappnode.eth", minVersion: "0.1.2" },
      { dnpName: "lodestar-holesky.dnp.dappnode.eth", minVersion: "0.1.3" },
    ],
    [Network.Lukso]: [
      { dnpName: "prysm-lukso.dnp.dappnode.eth", minVersion: "0.1.0" },
      { dnpName: "teku-lukso.dnp.dappnode.eth", minVersion: "0.1.0" },
    ],
  };

  constructor(dappnodeInstaller: DappnodeInstaller) {
    super(dappnodeInstaller);
  }

  async getAllConsensus(network: Network): Promise<StakerItem[]> {
    return await super.getAll(
      Consensus.CompatibleConsensus[network].map((client) => client.dnpName),
      Consensus.DbHandlers[network].get()
    );
  }

  async setNewConsensus(
    network: Network,
    newConsensusDnpName: string | null,
    newUseCheckpointSync?: boolean
  ) {
    const prevConsClientDnpName = Consensus.DbHandlers[network].get();

    await super.setNew({
      newStakerDnpName: newConsensusDnpName,
      compatibleClients: Consensus.CompatibleConsensus[network],
      belongsToStakerNetwork: this.belongsToStakerNetwork,
      userSettings: this.getConsensusUserSettings(
        newConsensusDnpName,
        network,
        newUseCheckpointSync
      ),
      prevClient: prevConsClientDnpName,
    });
    // persist on db
    if (newConsensusDnpName !== prevConsClientDnpName)
      await Consensus.DbHandlers[network].set(newConsensusDnpName);
  }

  private getConsensusUserSettings(
    newConsensusDnpName: string | null,
    network: Network,
    newUseCheckpointSync?: boolean
  ): UserSettingsAllDnps {
    const validatorServiceName =
      this.getValidatorServiceName(newConsensusDnpName);
    const beaconServiceName = this.getBeaconServiceName(newConsensusDnpName);
    const defaultDappnodeGraffiti = "validating_from_DAppNode";
    const defaultFeeRecipient = "0x0000000000000000000000000000000000000000";
    return newConsensusDnpName
      ? {
          [newConsensusDnpName]: {
            environment:
              beaconServiceName === validatorServiceName
                ? {
                    [validatorServiceName]: {
                      // Fee recipient is set as global env, keep this for backwards compatibility
                      ["FEE_RECIPIENT_ADDRESS"]: defaultFeeRecipient, // TODO: consider setting the MEV fee recipient as the default
                      // Graffiti is a mandatory value
                      ["GRAFFITI"]: defaultDappnodeGraffiti,
                      // Checkpoint sync is an optional value
                      ["CHECKPOINT_SYNC_URL"]: newUseCheckpointSync
                        ? Consensus.DefaultCheckpointSync[network]
                        : "",
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
                      ["CHECKPOINT_SYNC_URL"]: newUseCheckpointSync
                        ? Consensus.DefaultCheckpointSync[network]
                        : "",
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
