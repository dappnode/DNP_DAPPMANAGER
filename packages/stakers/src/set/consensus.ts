import { Network, UserSettingsAllDnps } from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";

export class Consensus extends StakerComponent {
  protected defaultCheckpointSync: string;
  protected beaconServiceName: string;
  protected validatorServiceName: string;
  protected useCheckpointSync: boolean;
  protected belongsToStakerNetwork = true;
  protected compatibleConsensus: {
    dnpName: string;
    minVersion: string;
  }[];

  constructor(
    dnpName: string | null,
    dappnodeInstaller: DappnodeInstaller,
    network: Network,
    useCheckpointSync: boolean
  ) {
    super(dnpName, network, dappnodeInstaller);
    this.compatibleConsensus = this.getCompatibleConsensus();
    this.defaultCheckpointSync = this.getDefaultCheckpointSync();
    this.beaconServiceName = this.getBeaconServiceName();
    this.validatorServiceName = this.getValidatorServiceName();
    this.useCheckpointSync = useCheckpointSync;
  }

  async setNewConsensus(
    newExecutionDnpName: string | null,
    newUseCheckpointSync?: boolean
  ) {
    // update checksync
    if (newUseCheckpointSync !== undefined)
      this.useCheckpointSync = newUseCheckpointSync;

    await super.setNew({
      newStakerDnpName: newExecutionDnpName,
      compatibleClients: this.compatibleConsensus,
      belongsToStakerNetwork: this.belongsToStakerNetwork,
      userSettings: this.getConsensusUserSettings(),
    });
  }

  private getConsensusUserSettings(): UserSettingsAllDnps {
    const validatorServiceName = this.getValidatorServiceName();
    const beaconServiceName = this.getBeaconServiceName();
    const defaultDappnodeGraffiti = "validating_from_DAppNode";
    const defaultFeeRecipient = "0x0000000000000000000000000000000000000000";
    return this.dnpName
      ? {
          [this.dnpName]: {
            environment:
              beaconServiceName === validatorServiceName
                ? {
                    [validatorServiceName]: {
                      // Fee recipient is set as global env, keep this for backwards compatibility
                      ["FEE_RECIPIENT_ADDRESS"]: defaultFeeRecipient, // TODO: consider setting the MEV fee recipient as the default
                      // Graffiti is a mandatory value
                      ["GRAFFITI"]: defaultDappnodeGraffiti,
                      // Checkpoint sync is an optional value
                      ["CHECKPOINT_SYNC_URL"]: this.useCheckpointSync
                        ? this.defaultCheckpointSync
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
                      ["CHECKPOINT_SYNC_URL"]: this.useCheckpointSync
                        ? this.defaultCheckpointSync
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
  private getValidatorServiceName(): string {
    return this.dnpName
      ? this.dnpName.includes("nimbus")
        ? "beacon-validator"
        : "validator"
      : "";
  }

  /**
   * Get the beacon service name
   * - Nimbus package is monoservice (beacon-validator)
   * - Prysm, Teku, Lighthouse, and Lodestar are multiservice (beacon, validator)
   */
  private getBeaconServiceName(): string {
    return this.dnpName
      ? this.dnpName.includes("nimbus")
        ? "beacon-validator"
        : "beacon-chain"
      : "";
  }

  private getDefaultCheckpointSync(): string {
    return this.network === "mainnet"
      ? "https://checkpoint-sync.dappnode.io"
      : this.network === "prater"
      ? "https://checkpoint-sync-prater.dappnode.io"
      : this.network === "gnosis"
      ? "https://checkpoint-sync-gnosis.dappnode.io"
      : this.network === "holesky"
      ? "https://checkpoint-sync-holesky.dappnode.io"
      : this.network === "lukso"
      ? "https://checkpoints.mainnet.lukso.network"
      : "";
  }

  private getCompatibleConsensus(): {
    dnpName: string;
    minVersion: string;
  }[] {
    switch (this.network) {
      case "mainnet":
        return [
          {
            dnpName: "prysm.dnp.dappnode.eth",
            minVersion: "3.0.4",
          },
          {
            dnpName: "lighthouse.dnp.dappnode.eth",
            minVersion: "1.0.3",
          },
          {
            dnpName: "teku.dnp.dappnode.eth",
            minVersion: "2.0.4",
          },
          {
            dnpName: "nimbus.dnp.dappnode.eth",
            minVersion: "1.0.5",
          },
          {
            dnpName: "lodestar.dnp.dappnode.eth",
            minVersion: "0.1.0",
          },
        ];
      case "gnosis":
        return [
          {
            dnpName: "lighthouse-gnosis.dnp.dappnode.eth",
            minVersion: "0.1.5",
          },
          {
            dnpName: "teku-gnosis.dnp.dappnode.eth",
            minVersion: "0.1.5",
          },
          {
            dnpName: "lodestar-gnosis.dnp.dappnode.eth",
            minVersion: "0.1.0",
          },
          {
            dnpName: "nimbus-gnosis.dnp.dappnode.eth",
            minVersion: "0.1.0",
          },
        ];
      case "prater":
        return [
          {
            dnpName: "prysm-prater.dnp.dappnode.eth",
            minVersion: "1.0.15",
          },
          {
            dnpName: "lighthouse-prater.dnp.dappnode.eth",
            minVersion: "0.1.9",
          },
          {
            dnpName: "teku-prater.dnp.dappnode.eth",
            minVersion: "0.1.10",
          },
          {
            dnpName: "nimbus-prater.dnp.dappnode.eth",
            minVersion: "0.1.7",
          },
          {
            dnpName: "lodestar-prater.dnp.dappnode.eth",
            minVersion: "0.1.0",
          },
        ];

      case "holesky":
        return [
          {
            dnpName: "lighthouse-holesky.dnp.dappnode.eth",
            minVersion: "0.1.2",
          },
          {
            dnpName: "prysm-holesky.dnp.dappnode.eth",
            minVersion: "0.1.3",
          },
          {
            dnpName: "teku-holesky.dnp.dappnode.eth",
            minVersion: "0.1.2",
          },
          {
            dnpName: "nimbus-holesky.dnp.dappnode.eth",
            minVersion: "0.1.2",
          },
          {
            dnpName: "lodestar-holesky.dnp.dappnode.eth",
            minVersion: "0.1.3",
          },
        ];
      case "lukso":
        return [
          /*{
            dnpName: "lighthouse-lukso.dnp.dappnode.eth" ,
            minVersion: "0.1.0"
          },*/
          {
            dnpName: "prysm-lukso.dnp.dappnode.eth",
            minVersion: "0.1.0",
          },
          {
            dnpName: "teku-lukso.dnp.dappnode.eth",
            minVersion: "0.1.0",
          },
        ];
      default:
        throw Error(`Unsupported network: ${this.network}`);
    }
  }
}
