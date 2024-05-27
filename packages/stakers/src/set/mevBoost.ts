import { Network, UserSettingsAllDnps } from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";

export class MevBoost extends StakerComponent {
  protected network: Network;
  protected relays: string[];
  protected belongsToStakerNetwork = false;
  protected compatibleMevBoost: {
    dnpName: string;
    minVersion: string;
  } | null;

  constructor(
    dnpName: string | null,
    dappnodeInstaller: DappnodeInstaller,
    network: Network,
    relays: string[]
  ) {
    super(dnpName, dappnodeInstaller);
    this.network = network;
    this.compatibleMevBoost = this.getCompatibleMevBoost();
    this.relays = relays;
  }

  async setNewMevBoost(
    newMevBoostDnpName: string | null,
    newRelays?: string[]
  ) {
    // update relays
    if (newRelays) this.relays = newRelays;
    await super.setNew({
      newStakerDnpName: newMevBoostDnpName,
      compatibleClients: this.compatibleMevBoost
        ? [this.compatibleMevBoost]
        : null,
      belongsToStakerNetwork: this.belongsToStakerNetwork,
      userSettings: this.getMevBoostUserSettings(),
    });
  }

  private getMevBoostUserSettings(): UserSettingsAllDnps {
    return this.dnpName
      ? {
          [this.dnpName]: {
            environment: {
              "mev-boost": {
                ["RELAYS"]:
                  this.relays
                    .join(",")
                    .trim()
                    .replace(/(^,)|(,$)/g, "") || "",
              },
            },
          },
        }
      : {};
  }

  private getCompatibleMevBoost(): {
    dnpName: string;
    minVersion: string;
  } | null {
    switch (this.network) {
      case "mainnet":
        return {
          dnpName: "mev-boost.dnp.dappnode.eth",
          minVersion: "0.1.0",
        };
      case "gnosis":
        return null;
      case "prater":
        return {
          dnpName: "mev-boost-goerli.dnp.dappnode.eth",
          minVersion: "0.1.0",
        };
      case "holesky":
        return {
          dnpName: "mev-boost-holesky.dnp.dappnode.eth",
          minVersion: "0.1.0",
        };
      case "lukso":
        return null;
      default:
        throw Error(`Unsupported network: ${this.network}`);
    }
  }
}
